import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, XCircle } from "lucide-react";
import { formatDateTime, formatMnt } from "@shared/format.js";
import { api } from "../../api.js";
import { useFetch, useDocumentTitle } from "../../hooks.js";
import { useLang } from "../../i18n.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import OrderTimeline from "../../components/OrderTimeline.jsx";
import PaymentPanel from "../../components/PaymentPanel.jsx";
import { ErrorState, Loading, StatusBadge } from "../../components/ui.jsx";

export default function OrderDetailPage() {
  const { code } = useParams();
  const { t, label } = useLang();
  const { refreshUnread } = useAuth();
  const toast = useToast();
  const { data: order, error, loading, reload, setData } = useFetch(() => api.get(`/me/orders/${code}`), [code]);
  const [payment, setPayment] = useState(null);
  useDocumentTitle(code);

  if (loading && !order) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const canPay = order.paymentStatus === "unpaid" && order.paymentMethod !== "cash" && order.status !== "cancelled";
  const canCancel = ["pending", "confirmed"].includes(order.status);

  const pay = async () => {
    try {
      setPayment(await api.post(`/me/orders/${code}/payment`));
    } catch (err) {
      toast.error(err.message);
    }
  };
  const cancel = async () => {
    if (!window.confirm(t("account.cancelConfirm"))) return;
    try {
      setData(await api.post(`/me/orders/${code}/cancel`, {}));
      refreshUnread();
      toast.success(label("orderStatus", "cancelled"));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="stack" style={{ "--gap": "18px" }}>
      <Link to="/account/orders" className="small row" style={{ "--gap": "4px" }}><ArrowLeft width={15} /> {t("account.orders")}</Link>
      <div className="row between">
        <div>
          <h1 className="mono">{order.code}</h1>
          <span className="small muted">{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="row">
          <StatusBadge group="orderStatus" status={order.status} />
          <StatusBadge group="paymentStatus" status={order.paymentStatus} />
        </div>
      </div>
      {order.status === "cancelled" && order.cancelReason && <div className="alert danger"><XCircle /> {order.cancelReason}</div>}
      {(canPay || canCancel) && (
        <div className="row">
          {canPay && !payment && <button type="button" className="btn btn-primary" onClick={pay}><CreditCard /> {t("account.payNow")}</button>}
          {canCancel && <button type="button" className="btn btn-danger" onClick={cancel}><XCircle /> {t("account.cancelOrder")}</button>}
        </div>
      )}
      {payment && <PaymentPanel payment={payment} orderCode={order.code} onPaid={(o) => { setData(o); setPayment(null); refreshUnread(); }} />}

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="card-head"><h2>{t("account.items")}</h2></div>
          <div className="card-body stack">
            {order.items.map((item) => (
              <div key={item.id} className="row nowrap" style={{ "--gap": "12px" }}>
                {item.image && <img src={item.image} alt="" className="thumb" />}
                <div className="grow">
                  {item.partId ? <Link to={`/parts/${item.partId}`} className="small strong">{item.partName}</Link> : <span className="small strong">{item.partName}</span>}
                  <div className="tiny muted">{label("condition", item.condition)} · {item.supplierName} · {formatMnt(item.unitPrice)} × {item.quantity}</div>
                </div>
                <strong className="num small">{formatMnt(item.lineTotal)}</strong>
              </div>
            ))}
            <hr className="divider" />
            <div className="sum-row"><span>{t("cart.subtotal")}</span><span className="num">{formatMnt(order.subtotal)}</span></div>
            <div className="sum-row"><span>{t("checkout.deliveryFee")}</span><span className="num">{order.deliveryFee ? formatMnt(order.deliveryFee) : t("checkout.free")}</span></div>
            {order.discount > 0 && <div className="sum-row text-success"><span>{t("checkout.discount")} ({order.couponCode})</span><span className="num">−{formatMnt(order.discount)}</span></div>}
            <div className="sum-row total"><span>{t("common.total")}</span><strong className="num">{formatMnt(order.total)}</strong></div>
            <div className="tiny muted">
              {label("deliveryMethod", order.deliveryMethod)} · {label("paymentMethod", order.paymentMethod)}
              {order.address && <div>{order.district}, {order.address}</div>}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>{t("account.timeline")}</h2></div>
          <div className="card-body"><OrderTimeline status={order.status} events={order.events} /></div>
        </div>
      </div>
    </div>
  );
}
