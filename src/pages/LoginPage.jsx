import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, LogIn } from "lucide-react";
import { useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Field } from "../components/ui.jsx";

// Туршилтын бүртгэл (seed өгөгдлөөс)
const DEMO = { email: "user@priusparts.test", password: "User123!" };

export default function LoginPage() {
  const { t } = useLang();
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useDocumentTitle(t("auth.loginTitle"));
  const next = params.get("next") || "/account";

  if (user) return <Navigate to={next} replace />;

  const submit = async (event, creds = form) => {
    event?.preventDefault();
    setError("");
    setBusy(true);
    try {
      const me = await login(creds.email, creds.password);
      toast.success(`${t("auth.welcome")}, ${me.name}!`);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page page-fade">
      <form className="auth-card card" onSubmit={submit}>
        <div className="center stack" style={{ alignItems: "center" }}>
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="48" height="48" />
          <h1>{t("auth.loginTitle")}</h1>
        </div>
        {error && <div className="alert danger">{error}</div>}
        <Field label={t("auth.email")}><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" /></Field>
        <Field label={t("auth.password")}><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" /></Field>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}><LogIn /> {t("auth.loginTitle")}</button>
        <div className="demo-box">
          <div className="tiny muted row" style={{ "--gap": "6px" }}><KeyRound width={14} /> {t("auth.demo")}: <span className="mono">{DEMO.email}</span> / <span className="mono">{DEMO.password}</span></div>
          <button type="button" className="btn btn-outline btn-sm btn-block mt-2" onClick={() => { setForm(DEMO); submit(null, DEMO); }} disabled={busy}>{t("auth.useDemo")}</button>
        </div>
        <p className="center small">{t("auth.noAccount")} <Link to={`/register?next=${encodeURIComponent(next)}`}>{t("nav.register")}</Link></p>
      </form>
    </div>
  );
}
