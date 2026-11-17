import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, BadgeCheck, CheckCircle2, Copy, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Wrench } from "lucide-react";
import { formatDate, formatMnt } from "@shared/format.js";
import { api } from "../api.js";
import { useFetch, useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import PartCard from "../components/PartCard.jsx";
import { ErrorState, Loading, PageHead, Stars } from "../components/ui.jsx";

function Gallery({ images, alt }) {
  const [index, setIndex] = useState(0);
  if (!images.length) return <div className="gallery__main skeleton" />;
  return (
    <div className="gallery">
      <div className="gallery__main"><img src={images[index].url} alt={alt} /></div>
      {images.length > 1 && (
        <div className="gallery__thumbs">
          {images.map((img, i) => (
            <button key={img.id} type="button" className={i === index ? "active" : ""} onClick={() => setIndex(i)} aria-label={`${i + 1}`}>
              <img src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OfferRow({ part, offer, cheapest, maxPrice }) {
  const { t, label } = useLang();
  const cart = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const inCart = cart.items.find((item) => item.offerId === offer.id);
  const out = offer.stock <= 0;

  const add = () => {
    cart.add(part, offer, qty);
    toast.success(`${t("part.added")}: ${label("condition", offer.condition)}`);
  };

  return (
    <div className={`offer ${offer.id === cheapest ? "is-best" : ""} ${out ? "is-out" : ""}`}>
      <div className="offer__info">
        <div className="row" style={{ "--gap": "6px" }}>
          <span className={`badge ${offer.condition === "new" ? "success" : offer.condition === "rebuilt" ? "accent" : "neutral"}`}>{label("condition", offer.condition)}</span>
          {offer.id === cheapest && <span className="badge amber">{t("part.cheapest")}</span>}
        </div>
        <div className="small strong mt-1">{offer.supplier.name}</div>
        <div className="tiny muted row" style={{ "--gap": "10px" }}>
          <span><ShieldCheck width={13} /> {offer.warrantyMonths ? `${offer.warrantyMonths} ${t("part.months")}` : t("part.noWarranty")}</span>
          <span>★ {offer.supplier.rating}</span>
          <span className={out ? "text-danger" : offer.stock <= 3 ? "text-warning" : ""}>{out ? t("part.outOfStock") : `${t("part.stock")}: ${offer.stock}`}</span>
        </div>
      </div>
      <div className="offer__price">
        {offer.oldPrice && <s className="tiny muted num">{formatMnt(offer.oldPrice)}</s>}
        <strong className="num">{formatMnt(offer.price)}</strong>
        {maxPrice > offer.price && <span className="tiny text-success">{t("part.save")} {formatMnt(maxPrice - offer.price)}</span>}
      </div>
      <div className="offer__actions">
        <div className="qty" aria-label={t("cart.qty")}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={out || qty <= 1} aria-label="-"><Minus /></button>
          <span className="num">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(offer.stock, q + 1))} disabled={out || qty >= offer.stock} aria-label="+"><Plus /></button>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={add} disabled={out}>
          <ShoppingCart /> {inCart ? `${inCart.quantity}` : t("part.addToCart")}
        </button>
      </div>
    </div>
  );
}

function Reviews({ part, onSubmitted }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const toast = useToast();
  const mine = part.reviews.find((r) => r.userId === user?.id);
  const [rating, setRating] = useState(mine?.rating || 5);
  const [comment, setComment] = useState(mine?.comment || "");
  const [busy, setBusy] = useState(false);
  const total = part.reviewCount || 0;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.post(`/parts/${part.id}/reviews`, { rating, comment });
      toast.success(result.message);
      onSubmitted();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="reviews">
      <div className="reviews__summary card card-body">
        <div className="reviews__score">{part.rating ?? "—"}</div>
        <Stars value={part.rating || 0} />
        <div className="small muted">{total} {lang === "mn" ? "үнэлгээ" : "reviews"}</div>
        <div className="stack mt-3" style={{ "--gap": "6px", width: "100%" }}>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="dist-row">
              <span className="tiny">{star}★</span>
              <div className="bar"><span style={{ width: `${total ? (part.ratingDistribution[star] / total) * 100 : 0}%` }} /></div>
              <span className="tiny muted num">{part.ratingDistribution[star]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="stack" style={{ "--gap": "14px" }}>
        {user ? (
          <form className="card card-body stack" onSubmit={submit}>
            <strong>{t("part.writeReview")}</strong>
            <div className="row" role="radiogroup" aria-label={t("part.yourRating")}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" role="radio" aria-checked={rating === star} className={`star-btn ${star <= rating ? "on" : ""}`} onClick={() => setRating(star)} aria-label={`${star}`}>★</button>
              ))}
            </div>
            <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("part.comment")} maxLength={1000} aria-label={t("part.comment")} />
            <div><button className="btn btn-primary" disabled={busy}>{t("part.submitReview")}</button></div>
          </form>
        ) : (
          <div className="alert"><Link to={`/login?next=/parts/${part.id}`}>{t("part.loginToReview")}</Link></div>
        )}
        {part.reviews.length === 0 && <p className="muted">{t("part.noReviews")}</p>}
        {part.reviews.map((review) => (
          <div key={review.id} className="review">
            <div className="row between">
              <div className="row" style={{ "--gap": "8px" }}>
                <span className="avatar sm">{review.userName.slice(-1)}</span>
                <strong className="small">{review.userName}</strong>
                {review.verified && <span className="badge success"><BadgeCheck /> {t("part.verified")}</span>}
              </div>
              <span className="tiny muted">{formatDate(review.createdAt)}</span>
            </div>
            <Stars value={review.rating} size={13} />
            {review.comment && <p className="small">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PartPage() {
  const { id } = useParams();
  const { t, tr, lang } = useLang();
  const { user } = useAuth();
  const { vehicle } = useMeta();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: part, error, loading, reload, setData } = useFetch(() => api.get(`/parts/${id}`), [id]);
  const [tab, setTab] = useState("offers");
  useDocumentTitle(part ? tr(part) : null);

  const stats = useMemo(() => {
    if (!part) return {};
    const available = part.offers.filter((o) => o.stock > 0);
    const cheapest = (available.length ? available : part.offers).reduce((best, o) => (!best || o.price < best.price ? o : best), null);
    return { cheapest: cheapest?.id, maxPrice: Math.max(...part.offers.map((o) => o.price)) };
  }, [part]);

  if (loading && !part) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const fits = vehicle?.generation ? part.generations.includes(vehicle.generation) : null;

  const toggleWish = async () => {
    if (!user) return navigate(`/login?next=/parts/${part.id}`);
    try {
      const result = part.inWishlist ? await api.del(`/me/wishlist/${part.id}`) : await api.post(`/me/wishlist/${part.id}`);
      setData((p) => ({ ...p, inWishlist: result.inWishlist }));
      toast.success(result.inWishlist ? t("part.inWishlist") : t("common.delete"));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    toast.info(`${t("common.copied")}: ${text}`);
  };

  return (
    <div className="page-fade">
      <PageHead
        title={tr(part)}
        crumbs={[{ label: t("nav.home"), to: "/" }, { label: t("catalog.title"), to: "/parts" }, { label: tr(part.category), to: `/parts?category=${part.category.slug}` }, { label: part.sku }]}
      />
      <div className="container">
        <div className="part-layout">
          <Gallery images={part.images} alt={tr(part)} />
          <div className="stack" style={{ "--gap": "16px" }}>
            <div className="row" style={{ "--gap": "8px" }}>
              {part.brand && <span className="badge info">{part.brand}</span>}
              {part.reviewCount > 0 && <span className="row small" style={{ "--gap": "4px" }}><Stars value={part.rating} /> {part.rating} ({part.reviewCount})</span>}
            </div>
            <dl className="spec-list">
              <div><dt>{t("part.sku")}</dt><dd className="mono">{part.sku}</dd></div>
              {part.oemNumber && (
                <div><dt>{t("part.oem")}</dt><dd className="mono">{part.oemNumber} <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => copy(part.oemNumber)} aria-label={t("common.copy")}><Copy /></button></dd></div>
              )}
              <div><dt>{t("part.compat")}</dt><dd>{part.compatibility.map((g) => g.name).join(", ")}</dd></div>
            </dl>
            {fits === true && <div className="alert success"><CheckCircle2 /> {t("part.fitsYour")}: <strong>{vehicle.label}</strong></div>}
            {fits === false && <div className="alert warning"><AlertTriangle /> {t("part.notFitYour")} ({vehicle.label})</div>}

            <div className="price-box">
              <div>
                <div className="tiny muted">{t("part.fromPrice")}</div>
                <div className="price-box__value num">{formatMnt(part.minPrice)}{part.maxPrice > part.minPrice && <span className="small muted"> – {formatMnt(part.maxPrice)}</span>}</div>
                <div className="tiny muted">{part.offers.length} {t("part.offers")}</div>
              </div>
              <button type="button" className={`btn ${part.inWishlist ? "btn-danger" : "btn-outline"}`} onClick={toggleWish} aria-pressed={part.inWishlist}>
                <Heart fill={part.inWishlist ? "currentColor" : "none"} /> {part.inWishlist ? t("part.inWishlist") : t("part.wishlist")}
              </button>
            </div>
            <div className="alert"><Wrench /> <span>{t("part.installHint")} <Link to="/services">{t("nav.services")} →</Link></span></div>
          </div>
        </div>

        <div className="tabs mt-5" role="tablist">
          {[["offers", `${t("part.compare")} (${part.offers.length})`], ["info", t("part.description")], ["compat", t("part.compat")], ["reviews", `${t("part.reviews")} (${part.reviewCount})`]].map(([key, text]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{text}</button>
          ))}
        </div>
        <div className="tab-panel">
          {tab === "offers" && (
            <div className="stack" style={{ "--gap": "10px" }}>
              {part.offers.map((offer) => <OfferRow key={offer.id} part={part} offer={offer} cheapest={stats.cheapest} maxPrice={stats.maxPrice} />)}
            </div>
          )}
          {tab === "info" && <p className="prose">{tr(part, "description") || "—"}</p>}
          {tab === "compat" && (
            <div className="card table-wrap">
              <table className="table">
                <thead><tr><th>{t("catalog.generation")}</th><th>{t("part.chassis")}</th><th>{t("part.years")}</th></tr></thead>
                <tbody>
                  {part.compatibility.map((g) => (
                    <tr key={g.code} className={vehicle?.generation === g.code ? "is-highlight" : ""}>
                      <td><strong>{g.name}</strong></td>
                      <td className="mono">{g.chassis.split(",").join(", ")}</td>
                      <td>{g.yearFrom}–{g.yearTo || (lang === "mn" ? "одоо" : "now")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "reviews" && <Reviews part={part} onSubmitted={reload} />}
        </div>

        {part.related.length > 0 && (
          <section className="mt-5 mb-4">
            <h2 className="mb-3">{t("part.related")}</h2>
            <div className="grid grid-4">{part.related.map((p) => <PartCard key={p.id} part={p} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
