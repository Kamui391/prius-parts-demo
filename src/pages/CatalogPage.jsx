import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Car, SlidersHorizontal, X } from "lucide-react";
import { api } from "../api.js";
import { useFetch, useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import PartCard, { PartCardSkeleton } from "../components/PartCard.jsx";
import { Empty, ErrorState, Icon, PageHead, Pagination } from "../components/ui.jsx";

const SORTS = ["popular", "price_asc", "price_desc", "newest", "rating"];
const CONDITIONS = ["new", "used", "rebuilt"];

export default function CatalogPage() {
  const { t, tr, label } = useLang();
  const { categories, generations, meta, vehicle } = useMeta();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  useDocumentTitle(t("catalog.title"));

  // "Миний машин" сонгосон бол үеийн шүүлтүүрийг автоматаар хэрэглэнэ (allgen=1 бол бүгдийг)
  const useVehicle = vehicle?.generation && !params.get("generation") && params.get("allgen") !== "1";
  const query = useMemo(() => {
    const q = Object.fromEntries(params.entries());
    delete q.allgen;
    if (useVehicle) q.generation = vehicle.generation;
    return { limit: 12, sort: "popular", ...q };
  }, [params, useVehicle, vehicle]);

  const { data, error, loading, reload } = useFetch(() => api.get("/parts", query), [JSON.stringify(query)]);

  const update = (patch, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === undefined || value === "" || value === false) next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage) next.delete("page");
    setParams(next);
  };
  const toggleList = (key, value) => {
    const list = (params.get(key) || "").split(",").filter(Boolean);
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    update({ [key]: next.join(",") });
  };
  const selected = (key) => (params.get(key) || "").split(",").filter(Boolean);

  const [price, setPrice] = useState({ min: params.get("minPrice") || "", max: params.get("maxPrice") || "" });
  useEffect(() => {
    setPrice({ min: params.get("minPrice") || "", max: params.get("maxPrice") || "" });
  }, [params]);

  const activeCategory = categories.find((c) => c.slug === params.get("category"));
  const q = params.get("q");
  const hasFilters = [...params.keys()].some((k) => !["sort", "page"].includes(k));

  const filters = (
    <div className="filters">
      <div className="filters__group">
        <div className="filters__title">{t("catalog.category")}</div>
        <button type="button" className={`filter-link ${!params.get("category") ? "active" : ""}`} onClick={() => update({ category: null })}>{t("common.all")}</button>
        {categories.map((c) => (
          <button key={c.slug} type="button" className={`filter-link ${params.get("category") === c.slug ? "active" : ""}`} onClick={() => update({ category: c.slug })}>
            <Icon name={c.icon} /> <span className="grow">{tr(c)}</span> <span className="tiny muted">{c.partCount}</span>
          </button>
        ))}
      </div>
      <div className="filters__group">
        <div className="filters__title">{t("catalog.generation")}</div>
        <div className="gen-chips">
          {generations.map((g) => {
            const active = selected("generation").includes(g.code) || (useVehicle && vehicle.generation === g.code);
            return (
              <button key={g.code} type="button" className={`chip ${active ? "active" : ""}`}
                onClick={() => (useVehicle ? update({ generation: g.code === vehicle.generation ? null : g.code, allgen: g.code === vehicle.generation ? 1 : null }) : toggleList("generation", g.code))}>
                {g.name.replace("Prius ", "")}
              </button>
            );
          })}
        </div>
      </div>
      <div className="filters__group">
        <div className="filters__title">{t("catalog.condition")}</div>
        {CONDITIONS.map((c) => (
          <label key={c} className="check"><input type="checkbox" checked={selected("condition").includes(c)} onChange={() => toggleList("condition", c)} /> {label("condition", c)}</label>
        ))}
      </div>
      <div className="filters__group">
        <div className="filters__title">{t("catalog.price")} (₮)</div>
        <form className="row nowrap" style={{ "--gap": "6px" }} onSubmit={(e) => { e.preventDefault(); update({ minPrice: price.min, maxPrice: price.max }); }}>
          <input className="input" inputMode="numeric" placeholder={t("catalog.min")} value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value.replace(/\D/g, "") })} aria-label={t("catalog.min")} />
          <input className="input" inputMode="numeric" placeholder={t("catalog.max")} value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value.replace(/\D/g, "") })} aria-label={t("catalog.max")} />
          <button className="btn btn-outline btn-icon" aria-label={t("catalog.apply")}>→</button>
        </form>
      </div>
      <div className="filters__group">
        <label className="check"><input type="checkbox" checked={params.get("inStock") === "1"} onChange={(e) => update({ inStock: e.target.checked ? 1 : null })} /> {t("catalog.inStock")}</label>
      </div>
      {meta?.brands?.length > 0 && (
        <div className="filters__group">
          <div className="filters__title">{t("catalog.brand")}</div>
          <select className="select" value={params.get("brand") || ""} onChange={(e) => update({ brand: e.target.value })} aria-label={t("catalog.brand")}>
            <option value="">{t("common.all")}</option>
            {meta.brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}
      {hasFilters && <button type="button" className="btn btn-ghost btn-block" onClick={() => setParams(new URLSearchParams())}><X /> {t("catalog.reset")}</button>}
    </div>
  );

  return (
    <div className="page-fade">
      <PageHead
        title={q ? `“${q}”` : activeCategory ? tr(activeCategory) : t("catalog.title")}
        crumbs={[{ label: t("nav.home"), to: "/" }, { label: t("catalog.title"), to: activeCategory || q ? "/parts" : undefined }, ...(activeCategory ? [{ label: tr(activeCategory) }] : [])]}
      />
      <div className="container catalog">
        <aside className="catalog__side only-desktop">{filters}</aside>
        <div className="catalog__main">
          {useVehicle && (
            <div className="vehicle-banner">
              <Car />
              <span className="grow">{t("vehicle.showingFor")} <strong>{vehicle.label}</strong></span>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => update({ allgen: 1 })}>{t("vehicle.all")}</button>
            </div>
          )}
          <div className="catalog__toolbar">
            <span className="muted small">{data ? `${data.total} ${t("catalog.results")}` : ""}</span>
            <div className="row" style={{ "--gap": "8px" }}>
              <button type="button" className="btn btn-outline btn-sm only-mobile" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /> {t("catalog.filters")}</button>
              <select className="select" style={{ width: "auto", height: 36 }} value={params.get("sort") || "popular"} onChange={(e) => update({ sort: e.target.value })} aria-label={t("catalog.sort")}>
                {SORTS.map((s) => <option key={s} value={s}>{t(`catalog.sort.${s}`)}</option>)}
              </select>
            </div>
          </div>
          {error ? <ErrorState error={error} onRetry={reload} /> : (
            <>
              <div className={`grid grid-3 ${loading && data ? "is-dim" : ""}`}>
                {!data && loading ? Array.from({ length: 6 }, (_, i) => <PartCardSkeleton key={i} />) : data?.items.map((part) => <PartCard key={part.id} part={part} />)}
              </div>
              {data && data.items.length === 0 && (
                <Empty title={t("catalog.empty")} text={t("catalog.emptyText")} action={<Link to={`/request${q ? `?part=${encodeURIComponent(q)}` : ""}`} className="btn btn-primary">{t("nav.request")}</Link>} />
              )}
              {data && <div className="mt-4"><Pagination page={data.page} pages={data.pages} onChange={(page) => update({ page }, false)} /></div>}
            </>
          )}
        </div>
      </div>
      {filtersOpen && (
        <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && setFiltersOpen(false)}>
          <aside className="drawer" aria-label={t("catalog.filters")}>
            <div className="row between mb-3">
              <strong>{t("catalog.filters")}</strong>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setFiltersOpen(false)} aria-label={t("common.close")}><X /></button>
            </div>
            {filters}
            <button type="button" className="btn btn-primary btn-block mt-3" onClick={() => setFiltersOpen(false)}>{t("catalog.apply")} ({data?.total ?? 0})</button>
          </aside>
        </div>
      )}
    </div>
  );
}
