import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Field } from "../components/ui.jsx";

export default function RegisterPage() {
  const { t } = useLang();
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useDocumentTitle(t("auth.registerTitle"));
  const next = params.get("next") || "/account/garage";
  if (user) return <Navigate to={next} replace />;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setError("");
    setBusy(true);
    try {
      const me = await register(form);
      toast.success(`${t("auth.welcome")}, ${me.name}!`);
      navigate(next, { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page page-fade">
      <form className="auth-card card" onSubmit={submit} noValidate>
        <div className="center stack" style={{ alignItems: "center" }}>
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="48" height="48" />
          <h1>{t("auth.registerTitle")}</h1>
        </div>
        {error && !Object.keys(errors).length && <div className="alert danger">{error}</div>}
        <Field label={t("auth.name")} error={errors.name}><input className="input" value={form.name} onChange={set("name")} required autoComplete="name" /></Field>
        <Field label={t("auth.email")} error={errors.email}><input className="input" type="email" value={form.email} onChange={set("email")} required autoComplete="email" /></Field>
        <Field label={t("auth.phone")} error={errors.phone}><input className="input" value={form.phone} onChange={set("phone")} required inputMode="tel" autoComplete="tel" placeholder="9911-2233" /></Field>
        <Field label={t("auth.password")} error={errors.password} hint={t("auth.passwordHint")}><input className="input" type="password" value={form.password} onChange={set("password")} required autoComplete="new-password" /></Field>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}><UserPlus /> {t("auth.registerTitle")}</button>
        <p className="center small">{t("auth.haveAccount")} <Link to={`/login?next=${encodeURIComponent(next)}`}>{t("nav.login")}</Link></p>
      </form>
    </div>
  );
}
