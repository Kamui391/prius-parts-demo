import { useState } from "react";
import { Link } from "react-router-dom";
import { Car, Gauge, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { formatKm } from "@shared/format.js";
import { api } from "../../api.js";
import { useFetch, useDocumentTitle } from "../../hooks.js";
import { useLang } from "../../i18n.jsx";
import { useMeta } from "../../context/MetaContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { Empty, Field, Loading, Modal } from "../../components/ui.jsx";

const EMPTY = { nickname: "", generationId: "", year: "", plateNo: "", frameNo: "", mileageKm: "" };

function VehicleForm({ initial, onClose, onSaved }) {
  const { t } = useLang();
  const { generations } = useMeta();
  const toast = useToast();
  const [form, setForm] = useState(initial ? { ...EMPTY, ...Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, v ?? ""])) } : EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Арлын дугаараас үеийг автоматаар тодорхойлно
  const decode = async () => {
    try {
      const r = await api.get("/vehicles/decode", { frame: form.frameNo });
      if (r.found) setForm((f) => ({ ...f, generationId: r.generation.id }));
      else toast.error(t("vehicle.notFound"));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      nickname: form.nickname || null, generationId: form.generationId ? Number(form.generationId) : null, year: form.year ? Number(form.year) : null,
      plateNo: form.plateNo || null, frameNo: form.frameNo || null, mileageKm: form.mileageKm ? Number(form.mileageKm) : null,
    };
    try {
      if (initial?.id) await api.put(`/me/vehicles/${initial.id}`, payload);
      else await api.post("/me/vehicles", payload);
      toast.success(t("account.saved"));
      onSaved();
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial?.id ? t("common.edit") : t("account.addVehicle")} onClose={onClose}
      footer={<><button type="button" className="btn btn-ghost" onClick={onClose}>{t("common.cancel")}</button><button type="submit" form="vehicle-form" className="btn btn-primary" disabled={busy}>{t("common.save")}</button></>}>
      <form id="vehicle-form" className="form-grid" onSubmit={submit}>
        <Field label={t("vehicle.frame")} className="span-all" error={errors.frameNo}>
          <div className="row nowrap">
            <input className="input mono grow" value={form.frameNo} onChange={set("frameNo")} placeholder={t("vehicle.framePlaceholder")} />
            <button type="button" className="btn btn-outline" onClick={decode} disabled={form.frameNo.length < 4}><Search /> {t("vehicle.decode")}</button>
          </div>
        </Field>
        <Field label={t("catalog.generation")} error={errors.generationId}>
          <select className="select" value={form.generationId} onChange={set("generationId")} required>
            <option value="">—</option>
            {generations.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.chassis.split(",")[0]})</option>)}
          </select>
        </Field>
        <Field label={t("account.vehicleName")}><input className="input" value={form.nickname} onChange={set("nickname")} maxLength={60} /></Field>
        <Field label={t("account.year")} error={errors.year}><input className="input" inputMode="numeric" value={form.year} onChange={set("year")} placeholder="2012" /></Field>
        <Field label={t("account.plate")}><input className="input" value={form.plateNo} onChange={set("plateNo")} placeholder="1234 УБА" /></Field>
        <Field label={t("account.mileage")} error={errors.mileageKm}><input className="input" inputMode="numeric" value={form.mileageKm} onChange={(e) => setForm((f) => ({ ...f, mileageKm: e.target.value.replace(/\D/g, "") }))} /></Field>
      </form>
    </Modal>
  );
}

export default function GaragePage() {
  const { t } = useLang();
  const { vehicle, setVehicle } = useMeta();
  const toast = useToast();
  const { data, loading, reload } = useFetch(() => api.get("/me/vehicles"), []);
  const [editing, setEditing] = useState(null);
  useDocumentTitle(t("account.garage"));

  const remove = async (v) => {
    if (!window.confirm(`${t("common.delete")}: ${v.nickname || v.generationName}?`)) return;
    try {
      await api.del(`/me/vehicles/${v.id}`);
      if (vehicle?.vehicleId === v.id) setVehicle(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && !data) return <Loading />;
  return (
    <div className="stack" style={{ "--gap": "16px" }}>
      <div className="row between">
        <h1>{t("account.garage")}</h1>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({})}><Plus /> {t("account.addVehicle")}</button>
      </div>
      {data.length === 0 ? (
        <Empty icon={Car} title={t("account.emptyGarage")} text={t("account.emptyGarageText")} action={<button type="button" className="btn btn-primary" onClick={() => setEditing({})}><Plus /> {t("account.addVehicle")}</button>} />
      ) : (
        <div className="grid grid-2">
          {data.map((v) => {
            const active = vehicle?.vehicleId === v.id;
            return (
              <article key={v.id} className={`garage-card card ${active ? "is-active" : ""}`}>
                <div className="garage-card__head">
                  <Car />
                  <div className="grow">
                    <h3>{v.nickname || v.generationName || "Prius"}</h3>
                    <span className="small muted">{v.generationName} {v.year || ""}</span>
                  </div>
                  {active && <span className="badge success">{t("account.active")}</span>}
                </div>
                <dl className="spec-list compact">
                  <div><dt>{t("account.plate")}</dt><dd>{v.plateNo || "—"}</dd></div>
                  <div><dt>{t("vehicle.frame")}</dt><dd className="mono">{v.frameNo || "—"}</dd></div>
                  <div><dt>{t("account.mileage")}</dt><dd>{formatKm(v.mileageKm)}</dd></div>
                </dl>
                <div className="row" style={{ "--gap": "6px" }}>
                  {!active && v.generationCode && <button type="button" className="btn btn-primary btn-sm" onClick={() => setVehicle({ generation: v.generationCode, label: v.nickname || v.generationName, vehicleId: v.id, mileageKm: v.mileageKm })}>{t("account.setActive")}</button>}
                  {v.generationCode && <Link to={`/parts?generation=${v.generationCode}`} className="btn btn-outline btn-sm">{t("nav.catalog")}</Link>}
                  {v.generationCode && v.mileageKm && <Link to={`/advisor?generation=${v.generationCode}&mileage=${v.mileageKm}`} className="btn btn-outline btn-sm"><Gauge /> {t("account.advice")}</Link>}
                  <span className="grow" />
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(v)} aria-label={t("common.edit")}><Pencil /></button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(v)} aria-label={t("common.delete")}><Trash2 /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {editing && <VehicleForm initial={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}
