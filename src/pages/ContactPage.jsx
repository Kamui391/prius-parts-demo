import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { api } from "../api.js";
import { useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Field, PageHead } from "../components/ui.jsx";

export default function ContactPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { settings } = useMeta();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || "", contact: user?.phone || user?.email || "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useDocumentTitle(t("contact.title"));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      const result = await api.post("/inquiries", form);
      toast.success(result.message);
      setForm((f) => ({ ...f, subject: "", message: "" }));
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const info = [
    [Phone, t("checkout.phone"), settings.shop_phone],
    [Mail, t("auth.email"), settings.shop_email],
    [MapPin, t("contact.address"), settings.shop_address],
    [Clock, t("contact.hours"), settings.working_hours],
  ];

  return (
    <div className="page-fade">
      <PageHead title={t("contact.title")} text={t("contact.text")} crumbs={[{ label: t("nav.home"), to: "/" }, { label: t("contact.title") }]} />
      <div className="container grid grid-2 mb-4" style={{ alignItems: "start" }}>
        <div className="stack">
          {info.map(([IconComp, title, value]) => (
            <div key={title} className="info-row card card-body">
              <span className="service-card__icon"><IconComp /></span>
              <div><div className="tiny muted">{title}</div><strong>{value || "—"}</strong></div>
            </div>
          ))}
        </div>
        <form className="card card-body form-grid" onSubmit={submit}>
          <Field label={t("checkout.name")} error={errors.name}><input className="input" value={form.name} onChange={set("name")} required /></Field>
          <Field label={t("contact.contact")} error={errors.contact}><input className="input" value={form.contact} onChange={set("contact")} required /></Field>
          <Field label={t("contact.subject")} error={errors.subject} className="span-all"><input className="input" value={form.subject} onChange={set("subject")} required /></Field>
          <Field label={t("contact.message")} error={errors.message} className="span-all"><textarea className="textarea" rows={5} value={form.message} onChange={set("message")} required /></Field>
          <div className="span-all"><button className="btn btn-primary" disabled={busy}><Send /> {t("contact.send")}</button></div>
        </form>
      </div>
    </div>
  );
}
