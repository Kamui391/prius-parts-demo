import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CalendarCheck, CheckCircle2, PartyPopper } from "lucide-react";
import { api } from "../api.js";
import { useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import PaymentPanel from "../components/PaymentPanel.jsx";
import { Loading, StatusBadge } from "../components/ui.jsx";

export default function OrderDonePage() {
  const { code } = useParams();
  const { state } = useLocation();
  const { t } = useLang();
  const { refreshUnread } = useAuth();
  const [order, setOrder] = useState(state?.order || null);
  const [payment, setPayment] = useState(state?.payment || null);
  useDocumentTitle(t("success.title"));

  useEffect(() => {
    refreshUnread();
    if (!order) api.get(`/me/orders/${code}`).then(setOrder).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (order && !payment && order.paymentMethod !== "cash" && order.paymentStatus === "unpaid" && order.status !== "cancelled") {
      api.post(`/me/orders/${code}/payment`).then(setPayment).catch(() => {});
    }
  }, [order, payment, code]);

  if (!order) return <Loading />;
  const paid = order.paymentStatus === "paid";

  return (
    <div className="container narrow page-fade mt-4 mb-4">
      <div className="done-hero">
        {paid ? <CheckCircle2 /> : <PartyPopper />}
        <h1>{paid ? t("pay.paid") : t("success.title")}</h1>
        <p>{t("success.text")} <strong className="mono">{order.code}</strong></p>
        <div className="row" style={{ justifyContent: "center" }}>
          <StatusBadge group="orderStatus" status={order.status} />
          <StatusBadge group="paymentStatus" status={order.paymentStatus} />
        </div>
        {order.deliveryMethod === "install" && <div className="alert success mt-3"><CalendarCheck /> {t("success.installBooked")} — <Link to="/account/bookings">{t("account.bookings")}</Link></div>}
      </div>
      {!paid && payment && order.status !== "cancelled" && (
        <PaymentPanel payment={payment} orderCode={order.code} onPaid={(o) => { setOrder(o); refreshUnread(); }} />
      )}
      <div className="row mt-4" style={{ justifyContent: "center" }}>
        <Link to={`/account/orders/${order.code}`} className="btn btn-primary">{t("success.viewOrder")}</Link>
        <Link to="/parts" className="btn btn-ghost">{t("cart.continue")}</Link>
      </div>
    </div>
  );
}
