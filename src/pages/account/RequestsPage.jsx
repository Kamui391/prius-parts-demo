import { Link } from "react-router-dom";
import { PackageSearch, Plus } from "lucide-react";
import { formatDate, formatMnt } from "@shared/format.js";
import { api } from "../../api.js";
import { useFetch, useDocumentTitle } from "../../hooks.js";
import { useLang } from "../../i18n.jsx";
import { Empty, Loading, StatusBadge } from "../../components/ui.jsx";

export default function RequestsPage() {
  const { t } = useLang();
  const { data, loading } = useFetch(() => api.get("/me/part-requests"), []);
  useDocumentTitle(t("account.requests"));
  if (loading && !data) return <Loading />;
  return (
    <div className="stack" style={{ "--gap": "16px" }}>
      <div className="row between">
        <h1>{t("account.requests")}</h1>
        <Link to="/request" className="btn btn-primary"><Plus /> {t("nav.request")}</Link>
      </div>
      {data.length === 0 ? <Empty icon={PackageSearch} title={t("account.noRequests")} /> : (
        <div className="stack" style={{ "--gap": "10px" }}>
          {data.map((r) => (
            <div key={r.id} className="card card-body stack" style={{ "--gap": "6px" }}>
              <div className="row between">
                <strong>{r.partName}</strong>
                <StatusBadge group="requestStatus" status={r.status} />
              </div>
              <div className="tiny muted">{r.code} · {formatDate(r.createdAt)} {r.generationName ? `· ${r.generationName}` : ""} {r.oemNumber ? `· OEM ${r.oemNumber}` : ""}</div>
              {r.quotedPrice && <div className="small">{t("account.quotedPrice")}: <strong className="num">{formatMnt(r.quotedPrice)}</strong></div>}
              {r.adminNote && <div className="alert tiny">{r.adminNote}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
