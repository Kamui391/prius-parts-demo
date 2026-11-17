import { Link } from "react-router-dom";
import { CalendarClock, Receipt, Wrench } from "lucide-react";
import { formatMnt } from "@shared/format.js";
import { api } from "../../api.js";
import { useFetch, useDocumentTitle } from "../../hooks.js";
import { useLang } from "../../i18n.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { Empty, ErrorState, Loading, StatusBadge } from "../../components/ui.jsx";

const STEPS = ["pending", "confirmed", "in_progress", "completed"];

export default function BookingsPage() {
  const { t, tr, label } = useLang();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch(() => api.get("/me/bookings"), []);
  useDocumentTitle(t("account.bookings"));

  const cancel = async (code) => {
    if (!window.confirm(`${t("account.cancelBooking")}?`)) return;
    try {
      await api.post(`/me/bookings/${code}/cancel`);
      toast.success(label("bookingStatus", "cancelled"));
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  // Удахгүй болох цагийг ойроос нь, түүхийг сүүлийнхээс нь эрэмбэлнэ
  const upcoming = data.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status))
    .sort((a, b) => `${a.date} ${a.timeSlot}`.localeCompare(`${b.date} ${b.timeSlot}`));
  const history = data.filter((b) => !upcoming.includes(b));

  const card = (b) => (
    <article key={b.id} className="booking-card card">
      <div className="booking-card__date">
        <strong>{b.date.slice(8)}</strong>
        <span className="tiny">{b.date.slice(5, 7)}/{b.date.slice(2, 4)}</span>
        <span className="small strong">{b.timeSlot}</span>
      </div>
      <div className="grow stack" style={{ "--gap": "6px" }}>
        <div className="row between">
          <strong>{tr(b.service)}</strong>
          <StatusBadge group="bookingStatus" status={b.status} />
        </div>
        <div className="tiny muted">{b.code} · {b.carInfo || "—"}{b.technician ? ` · ${t("account.technician")}: ${b.technician.name}` : ""}</div>
        {b.status !== "cancelled" && (
          <ol className="stepper is-small">
            {STEPS.map((step, index) => (
              <li key={step} className={index <= STEPS.indexOf(b.status) ? "done" : ""}>
                <span className="stepper__dot">{index + 1}</span>
                <span className="stepper__label">{label("bookingStatus", step)}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="row between">
          <span className="small">
            {b.finalPrice !== null ? <>{t("account.finalPrice")}: <strong className="num">{formatMnt(b.finalPrice)}</strong></> : <>{t("booking.estimate")}: <span className="num">{formatMnt(b.estimatedPrice)}</span></>}
          </span>
          <div className="row" style={{ "--gap": "6px" }}>
            {b.orderCode && <Link to={`/account/orders/${b.orderCode}`} className="btn btn-ghost btn-sm"><Receipt /> {b.orderCode}</Link>}
            {b.canCancel && <button type="button" className="btn btn-danger btn-sm" onClick={() => cancel(b.code)}>{t("account.cancelBooking")}</button>}
          </div>
        </div>
        {b.adminNote && <div className="alert tiny">{b.adminNote}</div>}
      </div>
    </article>
  );

  return (
    <div className="stack" style={{ "--gap": "16px" }}>
      <div className="row between">
        <h1>{t("account.bookings")}</h1>
        <Link to="/book" className="btn btn-primary"><CalendarClock /> {t("services.book")}</Link>
      </div>
      {data.length === 0 && <Empty icon={Wrench} title={t("account.noBookings")} action={<Link to="/services" className="btn btn-primary">{t("nav.services")}</Link>} />}
      {upcoming.length > 0 && <div className="stack" style={{ "--gap": "10px" }}>{upcoming.map(card)}</div>}
      {history.length > 0 && (
        <>
          <h2 className="mt-3">{t("account.serviceHistory")}</h2>
          <div className="stack" style={{ "--gap": "10px" }}>{history.map(card)}</div>
        </>
      )}
    </div>
  );
}
