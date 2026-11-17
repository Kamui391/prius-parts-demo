import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Car, Gauge, Heart, Receipt, Wallet } from "lucide-react";
import { formatDate, formatKm, formatMnt } from "@shared/format.js";
import { api } from "../../api.js";
import { useFetch, useDocumentTitle } from "../../hooks.js";
import { useLang } from "../../i18n.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useMeta } from "../../context/MetaContext.jsx";
import { Loading, StatusBadge } from "../../components/ui.jsx";

export default function AccountHome() {
  const { t, tr } = useLang();
  const { user } = useAuth();
  const { setVehicle, vehicle } = useMeta();
  useDocumentTitle(t("account.dashboard"));
  const { data } = useFetch(async () => {
    const [summary, orders, bookings, vehicles] = await Promise.all([
      api.get("/me/summary"), api.get("/me/orders", { limit: 4 }), api.get("/me/bookings"), api.get("/me/vehicles"),
    ]);
    return { summary, orders: orders.items, bookings: bookings.filter((b) => b.canCancel).slice(0, 3), vehicles };
  }, []);

  if (!data) return <Loading />;
  const { summary } = data;
  const stats = [
    [Receipt, t("account.activeOrders"), summary.activeOrders, "/account/orders"],
    [CalendarClock, t("account.upcoming"), summary.upcomingBookings, "/account/bookings"],
    [Car, t("account.garage"), summary.vehicles, "/account/garage"],
    [Heart, t("account.wishlist"), summary.wishlist, "/account/wishlist"],
    [Wallet, t("account.spent"), formatMnt(summary.spent), "/account/orders"],
  ];

  return (
    <div className="stack" style={{ "--gap": "20px" }}>
      <h1>{t("account.hello")}, {user.name.split(" ").slice(-1)[0]} 👋</h1>
      <div className="stat-grid">
        {stats.map(([IconComp, label, value, to]) => (
          <Link key={label} to={to} className="stat-card">
            <IconComp />
            <span className="stat-card__value num">{value}</span>
            <span className="tiny muted">{label}</span>
          </Link>
        ))}
      </div>

      {data.vehicles.length > 0 && (
        <div className="card">
          <div className="card-head"><h2>{t("account.garage")}</h2><Link to="/account/garage" className="small">{t("common.seeAll")}</Link></div>
          <div className="card-body grid grid-2">
            {data.vehicles.slice(0, 2).map((v) => (
              <div key={v.id} className="vehicle-mini">
                <Car />
                <div className="grow">
                  <strong>{v.nickname || v.generationName}</strong>
                  <div className="tiny muted">{v.generationName} {v.year || ""} · {v.plateNo || "—"} · {formatKm(v.mileageKm)}</div>
                  <div className="row mt-2" style={{ "--gap": "6px" }}>
                    <button type="button" className={`btn btn-sm ${vehicle?.vehicleId === v.id ? "btn-primary" : "btn-outline"}`} onClick={() => setVehicle({ generation: v.generationCode, label: v.nickname || v.generationName, vehicleId: v.id, mileageKm: v.mileageKm })}>
                      {vehicle?.vehicleId === v.id ? t("account.active") : t("account.setActive")}
                    </button>
                    {v.mileageKm && <Link to={`/advisor?generation=${v.generationCode}&mileage=${v.mileageKm}`} className="btn btn-sm btn-ghost"><Gauge /> {t("account.advice")}</Link>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h2>{t("account.recentOrders")}</h2><Link to="/account/orders" className="small">{t("common.seeAll")}</Link></div>
        {data.orders.length === 0 ? <p className="card-body muted">{t("account.noOrders")}</p> : (
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link to={`/account/orders/${o.code}`} className="mono strong">{o.code}</Link><div className="tiny muted">{formatDate(o.createdAt)}</div></td>
                    <td><StatusBadge group="orderStatus" status={o.status} /></td>
                    <td className="right num strong">{formatMnt(o.total)}</td>
                    <td className="right"><Link to={`/account/orders/${o.code}`} aria-label={t("common.details")}><ArrowRight width={16} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.bookings.length > 0 && (
        <div className="card">
          <div className="card-head"><h2>{t("account.upcoming")}</h2><Link to="/account/bookings" className="small">{t("common.seeAll")}</Link></div>
          <div className="card-body stack">
            {data.bookings.map((b) => (
              <div key={b.id} className="row between">
                <div><strong className="small">{tr(b.service)}</strong><div className="tiny muted">{b.date} {b.timeSlot} · {b.carInfo}</div></div>
                <StatusBadge group="bookingStatus" status={b.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
