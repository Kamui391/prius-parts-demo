import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Banknote, Building2, CalendarClock, QrCode, ShieldCheck, Store, TicketPercent, Truck, Wrench } from "lucide-react";
import { formatMnt, UB_DISTRICTS } from "@shared/format.js";
import { api } from "../api.js";
import { useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import SlotPicker from "../components/SlotPicker.jsx";
import { Empty, Field, PageHead } from "../components/ui.jsx";

const DELIVERY = [["delivery", Truck], ["pickup", Store], ["install", Wrench]];
const PAYMENT = [["qpay", QrCode], ["bank", Building2], ["cash", Banknote]];

function OptionCard({ name, value, current, icon: IconComp, title, desc, onChange }) {
  return (
    <label className={`option-card ${current === value ? "active" : ""}`}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} />
      <IconComp />
      <span className="grow"><strong>{title}</strong><span className="tiny muted">{desc}</span></span>
    </label>
  );
}

export default function CheckoutPage() {
  const { t, tr, label } = useLang();
  const { user } = useAuth();
  const cart = useCart();
  const { settings, vehicle } = useMeta();
  const toast = useToast();
  const navigate = useNavigate();
  useDocumentTitle(t("checkout.title"));

  const [form, setForm] = useState({
    customerName: user.name, customerPhone: user.phone || "", customerEmail: user.email, deliveryMethod: "delivery",
    paymentMethod: "qpay", district: "", address: "", note: "", couponCode: "",
  });
  const [install, setInstall] = useState({ date: null, slot: null });
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(vehicle?.vehicleId || "");
  const [coupon, setCoupon] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/me/vehicles").then((list) => {
      setVehicles(list);
      if (!vehicleId && list[0]) setVehicleId(list[0].id);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event?.target ? event.target.value : event }));
  const fee = form.deliveryMethod === "delivery" && !(Number(settings.free_delivery_over) && cart.subtotal >= Number(settings.free_delivery_over)) ? Number(settings.delivery_fee || 0) : 0;
  const discount = coupon?.valid ? coupon.discount : 0;
  const total = cart.subtotal + fee - discount;

  const applyCoupon = async () => {
    if (!form.couponCode.trim()) return;
    try {
      const result = await api.post("/coupons/validate", { code: form.couponCode, subtotal: cart.subtotal });
      setCoupon(result);
      if (result.valid) toast.success(`${t("checkout.discount")}: ${formatMnt(result.discount)}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    if (form.deliveryMethod === "install" && !install.slot) {
      setErrors({ install: `${t("checkout.installDate")} — ${t("common.required")}` });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        couponCode: coupon?.valid ? coupon.code : null,
        items: cart.items.map((item) => ({ offerId: item.offerId, quantity: item.quantity })),
        ...(form.deliveryMethod === "install" ? { installDate: install.date, installSlot: install.slot, vehicleId: vehicleId || null } : {}),
      };
      const result = await api.post("/orders", payload);
      cart.clear();
      navigate(`/checkout/done/${result.order.code}`, { replace: true, state: result });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (cart.items.length === 0) {
    return <div className="container"><Empty title={t("cart.empty")} action={<Link to="/parts" className="btn btn-primary">{t("home.ctaParts")}</Link>} /></div>;
  }

  return (
    <div className="page-fade">
      <PageHead title={t("checkout.title")} crumbs={[{ label: t("cart.title"), to: "/cart" }, { label: t("checkout.title") }]} />
      <form className="container checkout-layout mb-4" onSubmit={submit} noValidate>
        <div className="stack" style={{ "--gap": "18px" }}>
          <section className="card card-body stack">
            <h3 className="step-title"><span>1</span>{t("checkout.contact")}</h3>
            <div className="form-grid">
              <Field label={t("checkout.name")} error={errors.customerName}><input className="input" value={form.customerName} onChange={set("customerName")} required autoComplete="name" /></Field>
              <Field label={t("checkout.phone")} error={errors.customerPhone}><input className="input" value={form.customerPhone} onChange={set("customerPhone")} required inputMode="tel" autoComplete="tel" /></Field>
              <Field label={t("checkout.email")} error={errors.customerEmail}><input className="input" type="email" value={form.customerEmail} onChange={set("customerEmail")} autoComplete="email" /></Field>
            </div>
          </section>

          <section className="card card-body stack">
            <h3 className="step-title"><span>2</span>{t("checkout.delivery")}</h3>
            <div className="option-grid">
              {DELIVERY.map(([value, IconComp]) => (
                <OptionCard key={value} name="delivery" value={value} current={form.deliveryMethod} icon={IconComp} title={label("deliveryMethod", value)} desc={t(`checkout.${value}.desc`)} onChange={set("deliveryMethod")} />
              ))}
            </div>
            {form.deliveryMethod === "delivery" && (
              <div className="form-grid">
                <Field label={t("checkout.district")} error={errors.district}>
                  <select className="select" value={form.district} onChange={set("district")} required>
                    <option value="">—</option>
                    {UB_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label={t("checkout.address")} error={errors.address} className="span-all">
                  <input className="input" value={form.address} onChange={set("address")} placeholder={t("checkout.addressPh")} autoComplete="street-address" />
                </Field>
              </div>
            )}
            {form.deliveryMethod === "install" && (
              <div className="stack">
                <div className="row small" style={{ "--gap": "6px" }}><CalendarClock width={16} /> <strong>{t("checkout.installDate")}</strong></div>
                <SlotPicker date={install.date} slot={install.slot} onChange={setInstall} />
                {errors.install && <span className="error small">{errors.install}</span>}
                {vehicles.length > 0 && (
                  <Field label={t("checkout.installVehicle")}>
                    <select className="select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.nickname || v.generationName} {v.plateNo ? `· ${v.plateNo}` : ""}</option>)}
                    </select>
                  </Field>
                )}
              </div>
            )}
            <Field label={`${t("checkout.note")} (${t("common.optional")})`}><textarea className="textarea" rows={2} value={form.note} onChange={set("note")} maxLength={500} /></Field>
          </section>

          <section className="card card-body stack">
            <h3 className="step-title"><span>3</span>{t("checkout.payment")}</h3>
            <div className="option-grid">
              {PAYMENT.map(([value, IconComp]) => (
                <OptionCard key={value} name="payment" value={value} current={form.paymentMethod} icon={IconComp} title={label("paymentMethod", value)} desc={t(`checkout.${value}.desc`)} onChange={set("paymentMethod")} />
              ))}
            </div>
          </section>
        </div>

        <aside className="card card-body summary">
          <h3>{t("checkout.summary")}</h3>
          <div className="stack" style={{ "--gap": "8px" }}>
            {cart.items.map((item) => (
              <div key={item.offerId} className="row nowrap small" style={{ "--gap": "8px" }}>
                <span className="grow truncate">{tr(item)} <span className="muted">× {item.quantity}</span></span>
                <span className="num">{formatMnt(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <hr className="divider" />
          <div className="row nowrap">
            <div className="input-group grow"><TicketPercent /><input className="input" value={form.couponCode} onChange={(e) => { set("couponCode")(e); setCoupon(null); }} placeholder={t("checkout.coupon")} aria-label={t("checkout.coupon")} /></div>
            <button type="button" className="btn btn-outline" onClick={applyCoupon}>{t("checkout.apply")}</button>
          </div>
          {coupon && !coupon.valid && <div className="error small">{coupon.message}</div>}
          {coupon?.valid && <div className="tiny text-success">{coupon.code}: {coupon.message}</div>}
          <div className="sum-row"><span>{t("cart.subtotal")}</span><span className="num">{formatMnt(cart.subtotal)}</span></div>
          <div className="sum-row"><span>{t("checkout.deliveryFee")}</span><span className="num">{fee ? formatMnt(fee) : t("checkout.free")}</span></div>
          {discount > 0 && <div className="sum-row text-success"><span>{t("checkout.discount")}</span><span className="num">−{formatMnt(discount)}</span></div>}
          <div className="sum-row total"><span>{t("common.total")}</span><strong className="num">{formatMnt(total)}</strong></div>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? t("common.loading") : t("checkout.place")}</button>
          <p className="tiny muted row" style={{ "--gap": "6px" }}><ShieldCheck width={14} /> {t("checkout.terms")}</p>
        </aside>
      </form>
    </div>
  );
}
