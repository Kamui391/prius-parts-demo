import { useState } from "react";
import { api } from "../../api.js";
import { useDocumentTitle } from "../../hooks.js";
import { useLang } from "../../i18n.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { Field } from "../../components/ui.jsx";

export default function ProfilePage() {
  const { t } = useLang();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [errors, setErrors] = useState({});
  useDocumentTitle(t("account.profile"));

  const saveProfile = async (event) => {
    event.preventDefault();
    setErrors({});
    try {
      setUser(await api.put("/auth/me", profile));
      toast.success(t("account.saved"));
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.message);
    }
  };
  const savePassword = async (event) => {
    event.preventDefault();
    setErrors({});
    try {
      const r = await api.put("/auth/me/password", pw);
      toast.success(r.message);
      setPw({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.message);
    }
  };

  return (
    <div className="stack" style={{ "--gap": "18px" }}>
      <h1>{t("account.profile")}</h1>
      <form className="card card-body form-grid" onSubmit={saveProfile}>
        <Field label={t("auth.name")} error={errors.name}><input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></Field>
        <Field label={t("auth.phone")} error={errors.phone}><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} required /></Field>
        <Field label={t("auth.email")}><input className="input" value={user.email} disabled /></Field>
        <div className="span-all"><button className="btn btn-primary">{t("common.save")}</button></div>
      </form>
      <form className="card card-body form-grid" onSubmit={savePassword}>
        <h3 className="span-all">{t("account.changePassword")}</h3>
        <Field label={t("account.currentPassword")} error={errors.currentPassword}><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required autoComplete="current-password" /></Field>
        <Field label={t("account.newPassword")} error={errors.newPassword} hint={t("auth.passwordHint")}><input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required autoComplete="new-password" /></Field>
        <div className="span-all"><button className="btn btn-outline">{t("account.changePassword")}</button></div>
      </form>
    </div>
  );
}
