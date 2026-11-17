import { useState } from "react";
import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import { formatDateTime, formatMnt } from "@shared/format.js";
import { api } from "../../api.js";
import { useFetch, useDocumentTitle } from "../../hooks.js";
import { useLang } from "../../i18n.jsx";
import { Empty, ErrorState, Loading, Pagination, StatusBadge } from "../../components/ui.jsx";

const TABS = ["", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const { t, label } = useLang();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  useDocumentTitle(t("account.orders"));
  const { data, error, loading, reload } = useFetch(() => api.get("/me/orders", { status, page }), [status, page]);

  return (
    <div className="stack" style={{ "--gap": "16px" }}>
      <h1>{t("account.orders")}</h1>
      <div className="tabs">
        {TABS.map((s) => <button key={s || "all"} type="button" className={`tab ${status === s ? "active" : ""}`} onClick={() => { setStatus(s); setPage(1); }}>{s ? label("orderStatus", s) : t("common.all")}</button>)}
      </div>
      {loading && !data ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : data.items.length === 0 ? (
        <Empty icon={Receipt} title={t("account.noOrders")} action={<Link to="/parts" className="btn btn-primary">{t("home.ctaParts")}</Link>} />
      ) : (
        <>
          <div className="stack" style={{ "--gap": "10px" }}>
            {data.items.map((o) => (
              <Link key={o.id} to={`/account/orders/${o.code}`} className="order-row card">
                <div className="grow">
                  <div className="row" style={{ "--gap": "8px" }}>
                    <strong className="mono">{o.code}</strong>
                    <StatusBadge group="orderStatus" status={o.status} />
                    <StatusBadge group="paymentStatus" status={o.paymentStatus} />
                  </div>
                  <div className="tiny muted mt-1">{formatDateTime(o.createdAt)} · {o.itemCount} {t("account.items").toLowerCase()} · {label("deliveryMethod", o.deliveryMethod)}</div>
                </div>
                <strong className="num">{formatMnt(o.total)}</strong>
              </Link>
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
