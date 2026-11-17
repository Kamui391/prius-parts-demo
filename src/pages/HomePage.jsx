import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, CalendarCheck, Car, CreditCard, Gauge, PackageSearch, ScanLine, Wrench } from "lucide-react";
import { formatMnt, formatNumber } from "@shared/format.js";
import { api } from "../api.js";
import { useFetch, useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import PartCard, { PartCardSkeleton } from "../components/PartCard.jsx";
import SearchBox from "../components/SearchBox.jsx";
import { Icon } from "../components/ui.jsx";

function FramePicker() {
  const { t } = useLang();
  const { generations, vehicle, setVehicle } = useMeta();
  const [frame, setFrame] = useState("");
  const [message, setMessage] = useState(null);

  const decode = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      const result = await api.get("/vehicles/decode", { frame });
      if (!result.found) return setMessage({ tone: "warning", text: t("vehicle.notFound") });
      setVehicle({ generation: result.generation.code, label: result.generation.name, frame: result.frame });
      setMessage({ tone: "success", text: `${result.generation.name} · ${result.compatibleParts} ${t("vehicle.compatible")}` });
    } catch (err) {
      setMessage({ tone: "danger", text: err.message });
    }
  };

  return (
    <div className="hero-card">
      <div className="row mb-2" style={{ "--gap": "8px" }}>
        <span className="hero-card__icon"><Car /></span>
        <div>
          <h2>{t("home.pickTitle")}</h2>
          <p className="small muted">{t("home.pickText")}</p>
        </div>
      </div>
      <form onSubmit={decode} className="row nowrap mt-3">
        <div className="input-group grow">
          <ScanLine />
          <input className="input mono" value={frame} onChange={(e) => setFrame(e.target.value)} placeholder={t("vehicle.framePlaceholder")} aria-label={t("vehicle.frame")} />
        </div>
        <button className="btn btn-primary" disabled={frame.trim().length < 4}>{t("vehicle.decode")}</button>
      </form>
      {message && <div className={`alert ${message.tone} mt-2`}>{message.text}</div>}
      <div className="tiny muted mt-3 mb-2">{t("vehicle.orPick")}</div>
      <div className="gen-chips">
        {generations.map((g) => (
          <button key={g.code} type="button" className={`chip ${vehicle?.generation === g.code ? "active" : ""}`} onClick={() => setVehicle({ generation: g.code, label: g.name })}>
            {g.name}
          </button>
        ))}
      </div>
      {vehicle && (
        <Link to={`/parts?generation=${vehicle.generation}`} className="btn btn-amber btn-block mt-3">
          {vehicle.label} — {t("home.ctaParts")} <ArrowRight />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const { t, tr } = useLang();
  const { categories, meta } = useMeta();
  useDocumentTitle(null);
  const featured = useFetch(() => api.get("/parts", { featured: 1, limit: 8, sort: "popular" }), []);
  const services = useFetch(() => api.get("/services"), []);

  const why = [
    [BadgeCheck, "home.why1"],
    [PackageSearch, "home.why2"],
    [CreditCard, "home.why3"],
    [Wrench, "home.why4"],
  ];

  return (
    <div className="page-fade">
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="eyebrow">{t("home.eyebrow")}</span>
            <h1>{t("home.title")}</h1>
            <p>{t("home.text")}</p>
            <div className="hero__search"><SearchBox /></div>
            <div className="row mt-3">
              <Link to="/parts" className="btn btn-amber btn-lg">{t("home.ctaParts")} <ArrowRight /></Link>
              <Link to="/book" className="btn btn-lg hero__ghost"><CalendarCheck /> {t("home.ctaBook")}</Link>
            </div>
            {meta && (
              <dl className="hero__stats">
                <div><dt>{formatNumber(meta.stats.parts)}+</dt><dd>{t("home.stat.parts")}</dd></div>
                <div><dt>{meta.stats.services}</dt><dd>{t("home.stat.services")}</dd></div>
                <div><dt>{formatNumber(meta.stats.deliveredOrders)}+</dt><dd>{t("home.stat.orders")}</dd></div>
              </dl>
            )}
          </div>
          <FramePicker />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("home.categories")}</h2>
            <Link to="/parts">{t("common.seeAll")} <ArrowRight width={15} /></Link>
          </div>
          <div className="cat-grid">
            {categories.map((c) => (
              <Link key={c.slug} to={`/parts?category=${c.slug}`} className="cat-tile">
                <span className="cat-tile__icon"><Icon name={c.icon} /></span>
                <span className="cat-tile__name">{tr(c)}</span>
                <span className="tiny muted">{c.partCount}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section is-alt">
        <div className="container">
          <div className="section-head">
            <h2>{t("home.featured")}</h2>
            <Link to="/parts?featured=1">{t("common.seeAll")} <ArrowRight width={15} /></Link>
          </div>
          <div className="grid grid-4">
            {featured.loading && !featured.data
              ? Array.from({ length: 4 }, (_, i) => <PartCardSkeleton key={i} />)
              : featured.data?.items.map((part) => <PartCard key={part.id} part={part} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>{t("home.services")}</h2>
              <p className="muted">{t("home.servicesText")}</p>
            </div>
            <Link to="/services">{t("common.seeAll")} <ArrowRight width={15} /></Link>
          </div>
          <div className="grid grid-3">
            {services.data?.slice(0, 6).map((s) => (
              <Link key={s.id} to={`/book?service=${s.slug}`} className="service-card">
                <span className="service-card__icon"><Icon name={s.icon} /></span>
                <div className="grow">
                  <h3>{tr(s)}</h3>
                  <p className="small muted clamp-2">{tr(s, "description")}</p>
                  <div className="row between mt-2">
                    <strong className="num">{formatMnt(s.priceFrom)}{s.priceTo ? "+" : ""}</strong>
                    <span className="tiny muted">{s.durationMin} {t("common.minutes")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section is-alt">
        <div className="container">
          <h2 className="center mb-4">{t("home.why")}</h2>
          <div className="grid grid-4">
            {why.map(([IconComp, key]) => (
              <div key={key} className="why-card">
                <span className="why-card__icon"><IconComp /></span>
                <h3>{t(`${key}.t`)}</h3>
                <p className="small muted">{t(`${key}.d`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid-2">
          <div className="cta-card">
            <Gauge />
            <div className="grow">
              <h3>{t("home.advisorTitle")}</h3>
              <p>{t("home.advisorText")}</p>
            </div>
            <Link to="/advisor" className="btn btn-amber">{t("home.advisorCta")}</Link>
          </div>
          <div className="cta-card is-light">
            <PackageSearch />
            <div className="grow">
              <h3>{t("home.requestTitle")}</h3>
              <p>{t("home.requestText")}</p>
            </div>
            <Link to="/request" className="btn btn-primary">{t("nav.request")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
