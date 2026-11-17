import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CalendarCheck, CheckCircle2, Clock, Gauge, Info, PackageSearch } from "lucide-react";
import { formatKm } from "@shared/format.js";
import { api } from "../api.js";
import { useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import PartCard from "../components/PartCard.jsx";
import { Field, Loading, PageHead } from "../components/ui.jsx";

const STATUS_ICON = { due: AlertCircle, soon: Clock, upcoming: Info, ok: CheckCircle2 };

export default function AdvisorPage() {
  const { t, tr } = useLang();
  const { generations, vehicle } = useMeta();
  const [params, setParams] = useSearchParams();
  const [generation, setGeneration] = useState(params.get("generation") || vehicle?.generation || "gen3");
  const [mileage, setMileage] = useState(params.get("mileage") || vehicle?.mileageKm || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOk, setShowOk] = useState(false);
  useDocumentTitle(t("advisor.title"));

  const run = async (gen, km) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await api.get("/advisor", { generation: gen, mileage: km }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get("mileage")) run(params.get("generation") || generation, params.get("mileage"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (event) => {
    event.preventDefault();
    setParams({ generation, mileage: String(mileage) }, { replace: true });
    run(generation, mileage);
  };

  const items = result?.items.filter((i) => showOk || i.status !== "ok") || [];

  return (
    <div className="page-fade">
      <PageHead title={t("advisor.title")} text={t("advisor.text")} crumbs={[{ label: t("nav.home"), to: "/" }, { label: t("advisor.title") }]} />
      <div className="container mb-4">
        <form className="card card-body advisor-form" onSubmit={submit}>
          <Field label={t("catalog.generation")}>
            <select className="select" value={generation} onChange={(e) => setGeneration(e.target.value)}>
              {generations.map((g) => <option key={g.code} value={g.code}>{g.name} ({g.chassis.split(",")[0]})</option>)}
            </select>
          </Field>
          <Field label={t("advisor.mileage")}>
            <div className="input-group"><Gauge /><input className="input num" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))} placeholder="186000" required /></div>
          </Field>
          <button className="btn btn-primary btn-lg" disabled={!mileage || loading}>{t("advisor.check")}</button>
        </form>
        {error && <div className="alert danger mt-3">{error}</div>}
        {loading && <Loading />}
        {result && !loading && (
          <div className="mt-4 stack" style={{ "--gap": "18px" }}>
            <div className="advisor-summary">
              <div><strong>{result.generation.name}</strong><span className="muted"> · {formatKm(result.mileage)}</span></div>
              <div className="row">
                {["due", "soon", "upcoming", "ok"].map((s) => (
                  <span key={s} className={`badge ${s === "due" ? "danger" : s === "soon" ? "warning" : s === "upcoming" ? "info" : "success"}`}>{t(`advisor.${s}`)}: {result.summary[s]}</span>
                ))}
              </div>
            </div>
            <div className="advice-list">
              {items.map((item) => {
                const IconComp = STATUS_ICON[item.status];
                return (
                  <article key={item.id} className={`advice is-${item.status}`}>
                    <IconComp className="advice__icon" />
                    <div className="grow stack" style={{ "--gap": "4px" }}>
                      <div className="row between">
                        <h3>{tr(item, "title")}</h3>
                        <span className="small strong">{t(`advisor.${item.status}`)}</span>
                      </div>
                      {item.generationSpecific && <span className="badge amber" style={{ alignSelf: "flex-start" }}>{t("advisor.specific")}</span>}
                      <p className="small muted">{tr(item, "description")}</p>
                      <div className="tiny muted">
                        {item.intervalKm ? `${formatKm(item.intervalKm)} ${t("advisor.every")} · ` : ""}
                        {t("advisor.next")}: <strong>{formatKm(item.nextAtKm)}</strong> ({formatKm(item.remainingKm)} {t("advisor.remaining")})
                      </div>
                      {item.status !== "ok" && (
                        <div className="row mt-1" style={{ "--gap": "8px" }}>
                          {item.service && <Link to={`/book?service=${item.service.slug}&note=${encodeURIComponent(tr(item, "title"))}`} className="btn btn-primary btn-sm"><CalendarCheck /> {t("advisor.bookService")}</Link>}
                          {item.categorySlug && <Link to={`/parts?category=${item.categorySlug}&generation=${result.generation.code}`} className="btn btn-outline btn-sm"><PackageSearch /> {t("advisor.findParts")}</Link>}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <label className="check"><input type="checkbox" checked={showOk} onChange={(e) => setShowOk(e.target.checked)} /> {t("advisor.ok")} ({result.summary.ok})</label>
            <p className="tiny muted">{t("advisor.disclaimer")}</p>
            {result.suggestedParts.length > 0 && (
              <section>
                <h2 className="mb-3">{t("advisor.suggested")}</h2>
                <div className="grid grid-4">{result.suggestedParts.map((p) => <PartCard key={p.id} part={p} />)}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
