import { FlaskConical, RotateCcw } from "lucide-react";
import { IS_DEMO } from "../api.js";
import { useLang } from "../i18n.jsx";

// GitHub Pages демо горимд хуудасны дээд талд тайлбар харуулна
export default function DemoBanner() {
  const { t } = useLang();
  if (!IS_DEMO) return null;
  const reset = async () => {
    if (!window.confirm(t("demo.resetConfirm"))) return;
    const { resetDemo } = await import("../demo/demoApi.js");
    resetDemo();
    try {
      ["pp_token", "pp_cart", "pp_vehicle"].forEach((key) => localStorage.removeItem(key));
    } catch {
      /* ignore */
    }
    window.location.reload();
  };
  return (
    <div className="demo-banner" role="note">
      <div className="container row between" style={{ "--gap": "8px" }}>
        <span className="row" style={{ "--gap": "6px" }}>
          <FlaskConical width={15} />
          <span>{t("demo.banner")} <strong className="mono">user@priusparts.test</strong> / <strong className="mono">User123!</strong></span>
        </span>
        <button type="button" className="demo-banner__reset" onClick={reset}><RotateCcw width={13} /> {t("demo.reset")}</button>
      </div>
    </div>
  );
}
