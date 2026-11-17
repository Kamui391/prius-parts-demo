import { Link } from "react-router-dom";
import { Tag } from "lucide-react";
import { formatMnt } from "@shared/format.js";
import { useLang } from "../i18n.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import { Stars } from "./ui.jsx";

export default function PartCard({ part, compact = false }) {
  const { t, tr, lang } = useLang();
  const { vehicle, generationByCode } = useMeta();
  const fits = vehicle?.generation ? part.generations.includes(vehicle.generation) : null;
  const stockLabel = part.totalStock <= 0 ? ["danger", t("part.outOfStock")] : part.totalStock <= 3 ? ["warning", t("part.lowStock")] : ["success", t("part.inStock")];

  return (
    <article className={`part-card ${compact ? "is-compact" : ""}`}>
      <Link to={`/parts/${part.id}`} className="part-card__media" aria-label={tr(part)}>
        {part.image ? <img src={part.image} alt="" loading="lazy" /> : <div className="part-card__noimg" />}
        <div className="part-card__flags">
          {part.hasDiscount && <span className="badge amber"><Tag />{lang === "mn" ? "Хямдрал" : "Sale"}</span>}
          {fits && <span className="badge success">{t("part.fitsYour")}</span>}
        </div>
      </Link>
      <div className="part-card__body">
        <div className="part-card__meta">
          <span>{tr(part.category)}</span>
          {part.brand && <span>· {part.brand}</span>}
        </div>
        <h3 className="part-card__title"><Link to={`/parts/${part.id}`}>{tr(part)}</Link></h3>
        <div className="part-card__gens">
          {part.generations.map((code) => (
            <span key={code} className={`gen-tag ${vehicle?.generation === code ? "is-mine" : ""}`}>{generationByCode(code)?.name.replace("Prius ", "") || code}</span>
          ))}
        </div>
        {part.reviewCount > 0 && (
          <div className="row tiny muted" style={{ "--gap": "6px" }}>
            <Stars value={part.rating} size={13} /> <span>{part.rating} ({part.reviewCount})</span>
          </div>
        )}
        <div className="part-card__foot">
          <div>
            <div className="part-card__price num">
              {part.minPrice ? formatMnt(part.minPrice) : "—"}
              {part.maxPrice > part.minPrice && <span className="part-card__from">{lang === "mn" ? "-аас" : "+"}</span>}
            </div>
            <div className="tiny muted">{part.offerCount > 1 ? `${part.offerCount} ${t("part.offers")}` : "\u00a0"}</div>
          </div>
          <span className={`badge ${stockLabel[0]}`}>{stockLabel[1]}</span>
        </div>
      </div>
    </article>
  );
}

export function PartCardSkeleton() {
  return (
    <div className="part-card">
      <div className="skeleton" style={{ aspectRatio: "4 / 3", borderRadius: 0 }} />
      <div className="part-card__body">
        <div className="skeleton" style={{ height: 12, width: "40%" }} />
        <div className="skeleton" style={{ height: 18, width: "85%" }} />
        <div className="skeleton" style={{ height: 22, width: "50%", marginTop: 12 }} />
      </div>
    </div>
  );
}
