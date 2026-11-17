import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Clock } from "lucide-react";
import { formatMnt } from "@shared/format.js";
import { api } from "../api.js";
import { useFetch, useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { ErrorState, Icon, Loading, PageHead } from "../components/ui.jsx";

export default function ServicesPage() {
  const { t, tr, label } = useLang();
  const { data, error, loading, reload } = useFetch(() => api.get("/services"), []);
  const [category, setCategory] = useState("");
  useDocumentTitle(t("services.title"));

  const categories = [...new Set((data || []).map((s) => s.category))];
  const list = (data || []).filter((s) => !category || s.category === category);

  return (
    <div className="page-fade">
      <PageHead title={t("services.title")} text={t("services.text")} crumbs={[{ label: t("nav.home"), to: "/" }, { label: t("services.title") }]}>
        <Link to="/book" className="btn btn-amber"><CalendarCheck /> {t("services.book")}</Link>
      </PageHead>
      <div className="container mb-4">
        <div className="row mb-3">
          <button type="button" className={`chip ${!category ? "active" : ""}`} onClick={() => setCategory("")}>{t("common.all")}</button>
          {categories.map((c) => <button key={c} type="button" className={`chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{label("serviceCategory", c)}</button>)}
        </div>
        {loading && !data ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
          <div className="grid grid-2">
            {list.map((s) => (
              <article key={s.id} className="service-row card">
                <span className="service-card__icon"><Icon name={s.icon} /></span>
                <div className="grow stack" style={{ "--gap": "6px" }}>
                  <div className="row between">
                    <h3>{tr(s)}</h3>
                    <span className="badge accent">{label("serviceCategory", s.category)}</span>
                  </div>
                  <p className="small muted">{tr(s, "description")}</p>
                  <div className="row between mt-2">
                    <div>
                      <strong className="num">{formatMnt(s.priceFrom)}</strong>
                      {s.priceTo && <span className="small muted num"> – {formatMnt(s.priceTo)}</span>}
                      <span className="tiny muted row" style={{ "--gap": "4px" }}><Clock width={13} /> {s.durationMin} {t("common.minutes")}</span>
                    </div>
                    <Link to={`/book?service=${s.slug}`} className="btn btn-primary btn-sm">{t("services.book")}</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
