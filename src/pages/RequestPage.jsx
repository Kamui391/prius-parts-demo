import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { api } from "../api.js";
import { useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Field, PageHead } from "../components/ui.jsx";

export default function RequestPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { generations, vehicle } = useMeta();
  const toast = useToast();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: user?.name || "", phone: user?.phone || "", partName: params.get("part") || "", oemNumber: "",
    frameNo: vehicle?.frame || "", generationId: generations.find((g) => g.code === vehicle?.generation)?.id || "", note: "",
  });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(t("request.title"));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      setDone(await api.post("/part-requests", { ...form, generationId: form.generationId || null }));
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-fade">
      <PageHead title={t("request.title")} text={t("request.text")} crumbs={[{ label: t("nav.home"), to: "/" }, { label: t("request.title") }]} />
      <div className="container narrow mb-4">
        {done ? (
          <div className="done-hero card card-body">
            <CheckCircle2 />
            <h2>{t("request.success")} <span className="mono">{done.code}</span></h2>
            <p className="muted">{done.message}</p>
            {user && <Link to="/account/requests" className="btn btn-primary mt-3">{t("account.requests")}</Link>}
          </div>
        ) : (
          <form className="card card-body form-grid" onSubmit={submit}>
            <Field label={t("request.partName")} error={errors.partName} className="span-all">
              <div className="input-group"><PackageSearch /><input className="input" value={form.partName} onChange={set("partName")} required /></div>
            </Field>
            <Field label={t("request.oem")} error={errors.oemNumber}><input className="input mono" value={form.oemNumber} onChange={set("oemNumber")} /></Field>
            <Field label={t("catalog.generation")}>
              <select className="select" value={form.generationId} onChange={set("generationId")}>
                <option value="">—</option>
                {generations.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
            <Field label={t("vehicle.frame")}><input className="input mono" value={form.frameNo} onChange={set("frameNo")} placeholder={t("vehicle.framePlaceholder")} /></Field>
            <Field label={t("checkout.name")} error={errors.name}><input className="input" value={form.name} onChange={set("name")} required /></Field>
            <Field label={t("checkout.phone")} error={errors.phone}><input className="input" value={form.phone} onChange={set("phone")} required inputMode="tel" /></Field>
            <Field label={`${t("checkout.note")} (${t("common.optional")})`} className="span-all"><textarea className="textarea" value={form.note} onChange={set("note")} maxLength={1000} /></Field>
            <div className="span-all"><button className="btn btn-primary" disabled={busy}>{t("request.submit")}</button></div>
          </form>
        )}
      </div>
    </div>
  );
}
