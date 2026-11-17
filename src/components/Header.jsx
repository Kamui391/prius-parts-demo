import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, Car, ChevronDown, LogOut, Menu, Moon, ShoppingCart, Sun, User, X } from "lucide-react";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import SearchBox from "./SearchBox.jsx";
import VehicleSelector from "./VehicleSelector.jsx";

function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("pp_theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };
  return [theme, toggle];
}

export default function Header() {
  const { t, lang, setLang } = useLang();
  const { user, logout, unread } = useAuth();
  const { count } = useCart();
  const { vehicle } = useMeta();
  const [theme, toggleTheme] = useTheme();
  const [drawer, setDrawer] = useState(false);
  const [picker, setPicker] = useState(false);
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setDrawer(false);
    setMenu(false);
  }, [location.pathname]);

  const links = [
    ["/parts", t("nav.catalog")],
    ["/services", t("nav.services")],
    ["/advisor", t("nav.advisor")],
    ["/calculator", t("nav.calculator")],
    ["/request", t("nav.request")],
  ];

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container row between">
          <span className="tiny topbar__info">📞 7711-2233 · {lang === "mn" ? "Да–Ба 09:00–19:00" : "Mon–Fri 09:00–19:00"}</span>
          <div className="row" style={{ "--gap": "14px" }}>
            <Link to="/track" className="tiny">{t("nav.track")}</Link>
            <Link to="/contact" className="tiny">{t("nav.contact")}</Link>
            <button type="button" className="lang-switch tiny" onClick={() => setLang(lang === "mn" ? "en" : "mn")} aria-label="language">
              {lang === "mn" ? "EN" : "MN"}
            </button>
          </div>
        </div>
      </div>
      <div className="container header-main">
        <button type="button" className="btn btn-ghost btn-icon only-mobile" onClick={() => setDrawer(true)} aria-label={t("nav.menu")}><Menu /></button>
        <Link to="/" className="logo" aria-label="Prius Parts">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="36" height="36" />
          <span>
            <strong>Prius Parts</strong>
            <small>{t("brand.tagline")}</small>
          </span>
        </Link>
        <div className="header-search only-desktop"><SearchBox /></div>
        <button type="button" className={`vehicle-pill ${vehicle ? "is-set" : ""}`} onClick={() => setPicker(true)}>
          <Car />
          <span className="only-desktop">{vehicle ? vehicle.label : t("vehicle.choose")}</span>
        </button>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost btn-icon theme-btn" onClick={toggleTheme} aria-label="theme">{theme === "dark" ? <Sun /> : <Moon />}</button>
          {user && (
            <Link to="/account/notifications" className="btn btn-ghost btn-icon icon-badge" aria-label={t("nav.notifications")}>
              <Bell />
              {unread > 0 && <span className="count">{unread > 9 ? "9+" : unread}</span>}
            </Link>
          )}
          <Link to="/cart" className="btn btn-ghost btn-icon icon-badge" aria-label={t("nav.cart")}>
            <ShoppingCart />
            {count > 0 && <span className="count">{count > 99 ? "99+" : count}</span>}
          </Link>
          {user ? (
            <div className="user-menu">
              <button type="button" className="btn btn-ghost user-btn" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-label={t("nav.account")}>
                <span className="avatar">{user.name.slice(0, 1)}</span>
                <span className="only-desktop truncate" style={{ maxWidth: 120 }}>{user.name.split(" ").slice(-1)[0]}</span>
                <ChevronDown className="only-desktop" />
              </button>
              {menu && (
                <div className="dropdown" role="menu">
                  <Link to="/account" role="menuitem"><User /> {t("nav.account")}</Link>
                  <Link to="/account/orders" role="menuitem">{t("account.orders")}</Link>
                  <Link to="/account/bookings" role="menuitem">{t("account.bookings")}</Link>
                  <Link to="/account/garage" role="menuitem">{t("account.garage")}</Link>
                  <button type="button" role="menuitem" onClick={() => { logout(); navigate("/"); }}><LogOut /> {t("nav.logout")}</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">{t("nav.login")}</Link>
          )}
        </div>
      </div>
      <nav className="main-nav only-desktop" aria-label="main">
        <div className="container row" style={{ "--gap": "4px" }}>
          {links.map(([to, label]) => <NavLink key={to} to={to} className="main-nav__link">{label}</NavLink>)}
        </div>
      </nav>
      <div className="container only-mobile mobile-search"><SearchBox /></div>

      {drawer && (
        <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
          <aside className="drawer" aria-label={t("nav.menu")}>
            <div className="row between mb-3">
              <strong>Prius Parts</strong>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setDrawer(false)} aria-label={t("common.close")}><X /></button>
            </div>
            <NavLink to="/" end className="drawer__link">{t("nav.home")}</NavLink>
            {links.map(([to, label]) => <NavLink key={to} to={to} className="drawer__link">{label}</NavLink>)}
            <NavLink to="/track" className="drawer__link">{t("nav.track")}</NavLink>
            <NavLink to="/contact" className="drawer__link">{t("nav.contact")}</NavLink>
            <button type="button" className="drawer__link row" style={{ "--gap": "8px" }} onClick={toggleTheme}>{theme === "dark" ? <Sun width={17} /> : <Moon width={17} />} {theme === "dark" ? "Light" : "Dark"}</button>
            <div className="divider" />
            {user ? (
              <>
                <NavLink to="/account" className="drawer__link">{t("nav.account")}</NavLink>
                <button type="button" className="drawer__link" onClick={() => { logout(); navigate("/"); }}>{t("nav.logout")}</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="drawer__link">{t("nav.login")}</NavLink>
                <NavLink to="/register" className="drawer__link">{t("nav.register")}</NavLink>
              </>
            )}
          </aside>
        </div>
      )}
      {picker && <VehicleSelector onClose={() => setPicker(false)} />}
    </header>
  );
}
