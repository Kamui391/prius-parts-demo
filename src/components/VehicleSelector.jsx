// "Миний машин" сонгогч: арлын дугаараар таних, үеэр сонгох, гаражаас сонгох
import { useEffect, useState } from "react";
import { Car, CheckCircle2, ScanLine } from "lucide-react";
import { api } from "../api.js";
import { useLang } from "../i18n.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Modal } from "./ui.jsx";

export default function VehicleSelector({ onClose }) {
  const { t, lang } = useLang();
  const { generations, vehicle, setVehicle } = useMeta();
  const { user } = useAuth();
  const [frame, setFrame] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [garage, setGarage] = useState([]);

  useEffect(() => {
    if (user) api.get("/me/vehicles").then(setGarage).catch(() => {});
  }, [user]);

  const choose = (next) => {
    setVehicle(next);
    onClose();
  };

  const decode = async (event) => {
    event.preventDefault();
    setError("");
    setDecoded(null);
    setBusy(true);
    try {
      const result = await api.get("/vehicles/decode", { frame });
      if (!result.found) setError(t("vehicle.notFound"));
      else setDecoded(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={t("vehicle.choose")} onClose={onClose}>
      <form onSubmit={decode} className="stack">
        <label className="label" htmlFor="frame-input">{t("vehicle.frame")}</label>
        <div className="row nowrap">
          <div className="input-group grow">
            <ScanLine />
            <input id="frame-input" className="input mono" value={frame} onChange={(e) => setFrame(e.target.value)} placeholder={t("vehicle.framePlaceholder")} autoComplete="off" />
          </div>
          <button className="btn btn-primary" disabled={busy || frame.trim().length < 4}>{t("vehicle.decode")}</button>
        </div>
        {error && <div className="alert warning">{error}</div>}
        {decoded && (
          <div className="decoded">
            <CheckCircle2 />
            <div className="grow">
              <strong>{decoded.generation.name}</strong> <span className="muted">· {decoded.chassis} · {decoded.generation.engine}</span>
              <div className="small muted">{decoded.compatibleParts} {t("vehicle.compatible")}</div>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => choose({ generation: decoded.generation.code, label: decoded.generation.name, frame: decoded.frame })}>
              {t("common.confirm")}
            </button>
          </div>
        )}
      </form>

      {garage.length > 0 && (
        <>
          <div className="divider" />
          <div className="label mb-2">{t("vehicle.fromGarage")}</div>
          <div className="stack" style={{ "--gap": "8px" }}>
            {garage.filter((v) => v.generationCode).map((v) => (
              <button key={v.id} type="button" className={`gen-option ${vehicle?.vehicleId === v.id ? "active" : ""}`}
                onClick={() => choose({ generation: v.generationCode, label: v.nickname || v.generationName, vehicleId: v.id, mileageKm: v.mileageKm })}>
                <Car />
                <span className="grow">
                  <strong>{v.nickname || v.generationName}</strong>
                  <span className="small muted"> · {v.generationName} {v.year || ""} {v.plateNo ? `· ${v.plateNo}` : ""}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="divider" />
      <div className="label mb-2">{t("vehicle.orPick")}</div>
      <div className="gen-grid">
        {generations.map((g) => (
          <button key={g.code} type="button" className={`gen-option ${vehicle?.generation === g.code && !vehicle?.vehicleId ? "active" : ""}`}
            onClick={() => choose({ generation: g.code, label: g.name })}>
            <span className="gen-option__name">{g.name}</span>
            <span className="tiny muted">{g.chassis.split(",").join(" · ")}</span>
            <span className="tiny muted">{g.yearFrom}–{g.yearTo || (lang === "mn" ? "одоо" : "now")}</span>
          </button>
        ))}
      </div>
      {vehicle && (
        <button type="button" className="btn btn-ghost btn-block mt-3" onClick={() => choose(null)}>{t("vehicle.clear")} — {t("vehicle.all")}</button>
      )}
    </Modal>
  );
}
