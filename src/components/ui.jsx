// Жижиг давтагдах UI бүрэлдэхүүнүүд
import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, BatteryCharging, BatteryFull, CarFront, ChevronLeft, ChevronRight, ClipboardCheck, Cog, Cpu, Disc, Droplets, Fan,
  Lightbulb, MoveVertical, Package, PackageSearch, ScanLine, Snowflake, Star, Thermometer, Wind, Wrench, X, Zap,
} from "lucide-react";

// Өгөгдлийн санд хадгалсан icon нэр → бүрэлдэхүүн (бүх icon-ийг импортлохгүйгээр bundle-ийг жижиг байлгана)
const ICONS = {
  "battery-charging": BatteryCharging, "battery-full": BatteryFull, "car-front": CarFront, "clipboard-check": ClipboardCheck, cog: Cog,
  cpu: Cpu, disc: Disc, droplets: Droplets, fan: Fan, lightbulb: Lightbulb, "move-vertical": MoveVertical, package: Package,
  "scan-line": ScanLine, snowflake: Snowflake, thermometer: Thermometer, wind: Wind, wrench: Wrench, zap: Zap,
};
import { STATUS_TONE } from "@shared/format.js";
import { useLang } from "../i18n.jsx";

export function Icon({ name, ...props }) {
  const Component = ICONS[name] || Package;
  return <Component aria-hidden="true" {...props} />;
}

export function Stars({ value = 0, size = 15 }) {
  return (
    <span className="stars" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} width={size} height={size} fill={value >= star - 0.25 ? "currentColor" : "none"} opacity={value >= star - 0.75 ? 1 : 0.35} />
      ))}
    </span>
  );
}

export function StatusBadge({ group, status }) {
  const { label } = useLang();
  return <span className={`badge dot ${STATUS_TONE[status] || ""}`}>{label(group, status)}</span>;
}

export function Loading({ block = true }) {
  const { t } = useLang();
  return (
    <div className={block ? "loading-block" : "row"} role="status">
      <div className="spinner" />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useLang();
  return (
    <div className="empty">
      <AlertTriangle />
      <h3>{t("common.error")}</h3>
      <p>{error?.message}</p>
      {onRetry && <button type="button" className="btn btn-outline" onClick={onRetry}>{t("common.retry")}</button>}
    </div>
  );
}

export function Empty({ icon: IconComp = PackageSearch, title, text, action }) {
  return (
    <div className="empty">
      <IconComp />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const list = [];
  for (let i = 1; i <= pages; i += 1) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) list.push(i);
    else if (list[list.length - 1] !== "…") list.push("…");
  }
  return (
    <nav className="pagination" aria-label="pagination">
      <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="prev"><ChevronLeft /></button>
      {list.map((item, index) => (item === "…" ? <span key={`d${index}`} className="muted">…</span> : (
        <button key={item} type="button" className={`btn btn-outline ${item === page ? "active" : ""}`} onClick={() => onChange(item)} aria-current={item === page}>{item}</button>
      )))}
      <button type="button" className="btn btn-outline" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="next"><ChevronRight /></button>
    </nav>
  );
}

export function Modal({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="close"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function PageHead({ title, text, crumbs = [], children }) {
  return (
    <div className="page-head">
      <div className="container">
        {crumbs.length > 0 && (
          <nav className="crumbs" aria-label="breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={crumb.label}>
                {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
                {index < crumbs.length - 1 && <span className="sep">/</span>}
              </span>
            ))}
          </nav>
        )}
        <div className="row between">
          <div>
            <h1>{title}</h1>
            {text && <p className="page-head__text">{text}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Label нь input-ийг ороож авснаар дэлгэц уншигчид зөв холбогдоно. Олон товчтой бол as="div".
export function Field({ label, error, hint, children, className = "", as = "label" }) {
  const Wrapper = as;
  return (
    <Wrapper className={`field ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="error" role="alert">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </Wrapper>
  );
}
