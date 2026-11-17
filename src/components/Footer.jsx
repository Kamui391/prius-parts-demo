import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useLang } from "../i18n.jsx";
import { useMeta } from "../context/MetaContext.jsx";

export default function Footer() {
  const { t, tr } = useLang();
  const { categories, settings } = useMeta();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="stack">
          <Link to="/" className="logo">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="36" height="36" />
            <span><strong>Prius Parts</strong><small>{t("brand.tagline")}</small></span>
          </Link>
          <p className="small">{t("footer.about")}</p>
          <div className="row" style={{ "--gap": "6px" }}>
            {["QPay", "SocialPay", "Visa", "MasterCard"].map((name) => <span key={name} className="pay-chip">{name}</span>)}
          </div>
        </div>
        <div>
          <h4>{t("footer.shop")}</h4>
          <ul>
            {categories.slice(0, 6).map((c) => <li key={c.slug}><Link to={`/parts?category=${c.slug}`}>{tr(c)}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4>{t("footer.help")}</h4>
          <ul>
            <li><Link to="/services">{t("nav.services")}</Link></li>
            <li><Link to="/advisor">{t("nav.advisor")}</Link></li>
            <li><Link to="/calculator">{t("nav.calculator")}</Link></li>
            <li><Link to="/track">{t("nav.track")}</Link></li>
            <li><Link to="/request">{t("nav.request")}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{t("footer.contact")}</h4>
          <ul className="contact-list">
            <li><Phone /> {settings.shop_phone || "7711-2233"}</li>
            <li><Mail /> {settings.shop_email || "info@priusparts.test"}</li>
            <li><MapPin /> {settings.shop_address}</li>
            <li><Clock /> {settings.working_hours}</li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Prius Parts. {t("footer.rights")}</span>
        <span>{t("footer.demoNote")}</span>
      </div>
    </footer>
  );
}
