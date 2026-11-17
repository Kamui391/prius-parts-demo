import { NavLink, Outlet } from "react-router-dom";
import { Bell, CalendarClock, Car, Heart, LayoutDashboard, PackageSearch, Receipt, UserCog } from "lucide-react";
import { useLang } from "../../i18n.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AccountLayout() {
  const { t } = useLang();
  const { user, unread } = useAuth();
  const links = [
    ["/account", LayoutDashboard, t("account.dashboard"), true],
    ["/account/orders", Receipt, t("account.orders")],
    ["/account/bookings", CalendarClock, t("account.bookings")],
    ["/account/garage", Car, t("account.garage")],
    ["/account/wishlist", Heart, t("account.wishlist")],
    ["/account/requests", PackageSearch, t("account.requests")],
    ["/account/notifications", Bell, t("account.notifications"), false, unread],
    ["/account/profile", UserCog, t("account.profile")],
  ];
  return (
    <div className="container account-layout page-fade">
      <aside className="account-nav">
        <div className="account-nav__user">
          <span className="avatar lg">{user.name.slice(0, 1)}</span>
          <div className="grow" style={{ minWidth: 0 }}>
            <strong className="truncate" style={{ display: "block" }}>{user.name}</strong>
            <span className="tiny muted truncate" style={{ display: "block" }}>{user.email}</span>
          </div>
        </div>
        <nav>
          {links.map(([to, IconComp, text, end, badge]) => (
            <NavLink key={to} to={to} end={end} className="account-nav__link">
              <IconComp /> <span className="grow">{text}</span>
              {badge > 0 && <span className="badge danger">{badge}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="account-main"><Outlet /></section>
    </div>
  );
}
