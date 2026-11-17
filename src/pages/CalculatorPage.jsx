// Засварын зардлын тооцоолуур (хуучин төслийн "тооцоолуур"-ыг бодит каталог, ажлын хөлстэй холбож сайжруулсан)
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, CalendarCheck, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { formatMnt } from "@shared/format.js";
import { api } from "../api.js";
import { useDebounced, useFetch, useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Empty, PageHead } from "../components/ui.jsx";

function PartAdder({ onAdd }) {
  const { t, tr } = useLang();
  const { vehicle } = useMeta();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const debounced = useDebounced(q, 250);

  useEffect(() => {
    if (debounced.trim().length < 2) return setItems([]);
    api.get("/parts", { q: debounced, limit: 6, generation: vehicle?.generation }).then((r) => setItems(r.items)).catch(() => {});
  }, [debounced, vehicle]);

  const add = async (id) => {
    const detail = await api.get(`/parts/${id}`);
    onAdd(detail);
    setQ("");
    setItems([]);
  };

  return (
    <div className="searchbox">
      <div className="input-group"><Plus /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("calc.choosePart")} aria-label={t("calc.addPart")} /></div>
      {items.length > 0 && (
        <ul className="searchbox__list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="searchbox__item" onClick={() => add(item.id)}>
                {item.image && <img src={item.image} alt="" />}
                <span className="grow truncate">{tr(item)}</span>
                <span className="small num">{formatMnt(item.minPrice)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CalculatorPage() {
  const { t, tr, label } = useLang();
  const cart = useCart();
  const toast = useToast();
  const services = useFetch(() => api.get("/services"), []);
  const [parts, setParts] = useState([]); // [{ part, offerId, qty }]
  const [serviceIds, setServiceIds] = useState([]);
  useDocumentTitle(t("calc.title"));

  const addPart = (part) => {
    if (parts.some((p) => p.part.id === part.id)) return;
    const available = part.offers.filter((o) => o.stock > 0);
    const cheapest = (available.length ? available : part.offers).sort((a, b) => a.price - b.price)[0];
    setParts((list) => [...list, { part, offerId: cheapest?.id, qty: 1 }]);
  };

  const totals = useMemo(() => {
    const partsTotal = parts.reduce((sum, row) => sum + (row.part.offers.find((o) => o.id === row.offerId)?.price || 0) * row.qty, 0);
    const chosen = (services.data || []).filter((s) => serviceIds.includes(s.id));
    const laborMin = chosen.reduce((sum, s) => sum + s.priceFrom, 0);
    const laborMax = chosen.reduce((sum, s) => sum + (s.priceTo || s.priceFrom), 0);
    const newOnly = parts.reduce((sum, row) => {
      const fresh = row.part.offers.filter((o) => o.condition === "new").sort((a, b) => a.price - b.price)[0];
      return sum + (fresh ? fresh.price * row.qty : 0);
    }, 0);
    return { partsTotal, laborMin, laborMax, newOnly, chosen };
  }, [parts, serviceIds, services.data]);

  const toCart = () => {
    for (const row of parts) {
      const offer = row.part.offers.find((o) => o.id === row.offerId);
      if (offer && offer.stock > 0) cart.add(row.part, offer, row.qty);
    }
    toast.success(t("part.added"));
  };

  const empty = parts.length === 0 && serviceIds.length === 0;

  return (
    <div className="page-fade">
      <PageHead title={t("calc.title")} text={t("calc.text")} crumbs={[{ label: t("nav.home"), to: "/" }, { label: t("calc.title") }]} />
      <div className="container checkout-layout mb-4">
        <div className="stack" style={{ "--gap": "18px" }}>
          <section className="card card-body stack">
            <h3>{t("calc.parts")}</h3>
            <PartAdder onAdd={addPart} />
            {parts.map((row) => (
              <div key={row.part.id} className="calc-line">
                <img src={row.part.images[0]?.url} alt="" />
                <div className="grow stack" style={{ "--gap": "6px" }}>
                  <strong className="small">{tr(row.part)}</strong>
                  <select className="select" value={row.offerId} onChange={(e) => setParts((list) => list.map((r) => (r.part.id === row.part.id ? { ...r, offerId: Number(e.target.value) } : r)))} aria-label={t("calc.option")}>
                    {row.part.offers.map((o) => (
                      <option key={o.id} value={o.id} disabled={o.stock <= 0}>
                        {label("condition", o.condition)} · {formatMnt(o.price)} · {o.supplier.name}{o.stock <= 0 ? ` (${t("part.outOfStock")})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <input className="input num" style={{ width: 64 }} type="number" min="1" max="20" value={row.qty} onChange={(e) => setParts((list) => list.map((r) => (r.part.id === row.part.id ? { ...r, qty: Math.max(1, Number(e.target.value) || 1) } : r)))} aria-label={t("cart.qty")} />
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setParts((list) => list.filter((r) => r.part.id !== row.part.id))} aria-label={t("cart.remove")}><Trash2 /></button>
              </div>
            ))}
          </section>
          <section className="card card-body stack">
            <h3>{t("calc.labor")}</h3>
            <div className="service-pick">
              {services.data?.map((s) => (
                <label key={s.id} className={`service-pick__item ${serviceIds.includes(s.id) ? "active" : ""}`}>
                  <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => setServiceIds((ids) => (ids.includes(s.id) ? ids.filter((x) => x !== s.id) : [...ids, s.id]))} />
                  <span className="grow"><strong className="small">{tr(s)}</strong><span className="tiny muted">{formatMnt(s.priceFrom)}{s.priceTo ? ` – ${formatMnt(s.priceTo)}` : ""}</span></span>
                </label>
              ))}
            </div>
          </section>
        </div>
        <aside className="card card-body summary">
          <h3 className="row" style={{ "--gap": "8px" }}><Calculator /> {t("calc.grand")}</h3>
          {empty ? <Empty title={t("calc.empty")} /> : (
            <>
              <div className="sum-row"><span>{t("calc.partsTotal")}</span><span className="num">{formatMnt(totals.partsTotal)}</span></div>
              <div className="sum-row"><span>{t("calc.laborTotal")}</span><span className="num">{formatMnt(totals.laborMin)}{totals.laborMax > totals.laborMin ? ` – ${formatMnt(totals.laborMax)}` : ""}</span></div>
              <div className="sum-row total"><span>{t("common.total")}</span><strong className="num">{formatMnt(totals.partsTotal + totals.laborMin)}{totals.laborMax > totals.laborMin ? `+` : ""}</strong></div>
              {totals.newOnly > totals.partsTotal && (
                <div className="alert success tiny">{t("calc.compareNote")}: {t("calc.newest")} {formatMnt(totals.newOnly)} → {t("part.save")} {formatMnt(totals.newOnly - totals.partsTotal)}</div>
              )}
              {parts.length > 0 && <button type="button" className="btn btn-primary btn-block" onClick={toCart}><ShoppingCart /> {t("calc.addAllToCart")}</button>}
              {totals.chosen.length > 0 && <Link to={`/book?service=${totals.chosen[0].slug}`} className="btn btn-outline btn-block"><CalendarCheck /> {t("calc.book")}</Link>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
