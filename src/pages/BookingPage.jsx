import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import { formatMnt } from "@shared/format.js";
import { api } from "../api.js";
import { useFetch, useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import SlotPicker from "../components/SlotPicker.jsx";
import { Field, Icon, Loading, PageHead } from "../components/ui.jsx";

export default function BookingPage() {
  const { t, tr } = useLang();
  const { user, refreshUnread } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const services = useFetch(() => api.get("/services"), []);
  const [vehicles, setVehicles] = useState([]);
  const [pick, setPick] = useState({ date: null, slot: null });
  const [form, setForm] = useState({ vehicleId: "", carInfo: "", customerName: user?.name || "", customerPhone: user?.phone || "", note: params.get("note") || "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  useDocumentTitle(t("booking.title"));

  const service = useMemo(() => services.data?.find((s) => s.slug === params.get("service")), [services.data, params]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, customerName: f.customerName || user.name, customerPhone: f.customerPhone || user.phone || "" }));
    api.get("/me/vehicles").then((list) => {
      setVehicles(list);
      if (list[0]) setForm((f) => ({ ...f, vehicleId: f.vehicleId || list[0].id }));
    }).catch(() => {});
  }, [user]);

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      const booking = await api.post("/bookings", {
        serviceId: service.id, date: pick.date, timeSlot: pick.slot, vehicleId: form.vehicleId || null,
        carInfo: form.vehicleId ? null : form.carInfo, customerName: form.customerName, customerPhone: form.customerPhone, note: form.note,
      });
      setDone(booking);
      refreshUnread();
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="container narrow mt-5 mb-5 page-fade">
        <div className="done-hero">
          <CheckCircle2 />
          <h1>{t("booking.success")}</h1>
          <p>{t("booking.successText")} <strong className="mono">{done.code}</strong></p>
          <p className="strong">{tr(done.service)} · {done.date} {done.timeSlot}</p>
          <div className="row mt-3" style={{ justifyContent: "center" }}>
            <Link to="/account/bookings" className="btn btn-primary">{t("account.bookings")}</Link>
            <Link to="/parts" className="btn btn-ghost">{t("home.ctaParts")}</Link>
          </div>
        </div>
      </div>
    );
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="page-fade">
      <PageHead title={t("booking.title")} crumbs={[{ label: t("nav.services"), to: "/services" }, { label: t("booking.title") }]} />
      <div className="container booking-layout mb-4">
        <div className="stack" style={{ "--gap": "18px" }}>
          <section className="card card-body stack">
            <h3 className="step-title"><span>1</span>{t("booking.pickService")}</h3>
            {services.loading && !services.data ? <Loading /> : (
              <div className="service-pick">
                {services.data?.map((s) => (
                  <button key={s.id} type="button" className={`service-pick__item ${service?.id === s.id ? "active" : ""}`} onClick={() => setParams({ service: s.slug }, { replace: true })}>
                    <Icon name={s.icon} />
                    <span className="grow"><strong>{tr(s)}</strong><span className="tiny muted">{formatMnt(s.priceFrom)}{s.priceTo ? "+" : ""} · {s.durationMin} {t("common.minutes")}</span></span>
                  </button>
                ))}
              </div>
            )}
          </section>
          <section className={`card card-body stack ${service ? "" : "is-dim"}`}>
            <h3 className="step-title"><span>2</span>{t("booking.pickDate")}</h3>
            {service && <SlotPicker date={pick.date} slot={pick.slot} onChange={setPick} />}
          </section>
          <section className={`card card-body stack ${pick.slot ? "" : "is-dim"}`}>
            <h3 className="step-title"><span>3</span>{t("booking.details")}</h3>
            {!user ? (
              <div className="alert">
                <span className="grow">{t("booking.loginRequired")}</span>
                <Link className="btn btn-primary btn-sm" to={`/login?next=${encodeURIComponent(`/book?service=${params.get("service") || ""}`)}`}>{t("nav.login")}</Link>
              </div>
            ) : (
              <form className="form-grid" onSubmit={submit}>
                {vehicles.length > 0 && (
                  <Field label={t("booking.car")} className="span-all">
                    <select className="select" value={form.vehicleId} onChange={set("vehicleId")}>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.nickname || v.generationName} {v.year || ""} {v.plateNo ? `· ${v.plateNo}` : ""}</option>)}
                      <option value="">— {t("booking.carInfo")}</option>
                    </select>
                  </Field>
                )}
                {!form.vehicleId && (
                  <Field label={t("booking.carInfo")} className="span-all"><input className="input" value={form.carInfo} onChange={set("carInfo")} placeholder={t("booking.carInfoPh")} /></Field>
                )}
                <Field label={t("checkout.name")} error={errors.customerName}><input className="input" value={form.customerName} onChange={set("customerName")} required /></Field>
                <Field label={t("checkout.phone")} error={errors.customerPhone}><input className="input" value={form.customerPhone} onChange={set("customerPhone")} required inputMode="tel" /></Field>
                <Field label={t("booking.note")} className="span-all"><textarea className="textarea" rows={3} value={form.note} onChange={set("note")} maxLength={500} /></Field>
                <div className="span-all"><button className="btn btn-primary btn-lg" disabled={busy || !service || !pick.slot}><CalendarCheck /> {t("booking.submit")}</button></div>
              </form>
            )}
          </section>
        </div>
        <aside className="card card-body summary">
          <h3>{t("booking.title")}</h3>
          {service ? (
            <>
              <div className="row nowrap" style={{ "--gap": "10px" }}>
                <span className="service-card__icon"><Icon name={service.icon} /></span>
                <strong>{tr(service)}</strong>
              </div>
              <p className="small muted">{tr(service, "description")}</p>
              <div className="sum-row"><span>{t("booking.date")}</span><strong>{pick.date || "—"} {pick.slot || ""}</strong></div>
              <div className="sum-row"><span>{t("services.duration")}</span><span className="row" style={{ "--gap": "4px" }}><Clock width={14} /> {service.durationMin} {t("common.minutes")}</span></div>
              <div className="sum-row total"><span>{t("booking.estimate")}</span><strong className="num">{formatMnt(service.priceFrom)}{service.priceTo ? ` – ${formatMnt(service.priceTo)}` : ""}</strong></div>
            </>
          ) : <p className="muted small">{t("booking.pickService")}</p>}
        </aside>
      </div>
    </div>
  );
}
