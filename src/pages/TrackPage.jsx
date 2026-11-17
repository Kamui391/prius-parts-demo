import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { formatDateTime, formatMnt } from "@shared/format.js";
import { api } from "../api.js";
import { useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import OrderTimeline from "../components/OrderTimeline.jsx";
import { Field, PageHead, StatusBadge } from "../components/ui.jsx";

export default function TrackPage() {
  const { t, label } = useLang();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useDocumentTitle(t("track.title"));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setOrder(null);
    setBusy(true);
    try {
      setOrder(await api.get("/orders/track", { code: code.trim().toUpperCase(), phone }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-fade">
      <PageHead title={t("track.title")} text={t("track.text")} crumbs={[{ label: t("nav.home"), to: "/" }, { label: t("track.title") }]} />
      <div className="container narrow mb-4 stack" style={{ "--gap": "18px" }}>
        <form className="card card-body form-grid" onSubmit={submit}>
          <Field label={t("track.code")}><input className="input mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="PP-261114-1234" required /></Field>
          <Field label={t("checkout.phone")}><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required /></Field>
          <div className="span-all"><button className="btn btn-primary" disabled={busy}><Search /> {t("track.check")}</button></div>
        </form>
        {error && <div className="alert danger">{error}</div>}
        {order && (
          <div className="card card-body stack">
            <div className="row between">
              <div>
                <h3 className="mono">{order.code}</h3>
                <span className="tiny muted">{formatDateTime(order.createdAt)} · {label("deliveryMethod", order.deliveryMethod)}</span>
              </div>
              <div className="row"><StatusBadge group="orderStatus" status={order.status} /><StatusBadge group="paymentStatus" status={order.paymentStatus} /></div>
            </div>
            <ul className="small">{order.items.map((i, idx) => <li key={idx}>{i.partName} × {i.quantity}</li>)}</ul>
            <div className="sum-row total"><span>{t("common.total")}</span><strong className="num">{formatMnt(order.total)}</strong></div>
            <OrderTimeline status={order.status} events={order.events} />
          </div>
        )}
      </div>
    </div>
  );
}
