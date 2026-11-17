import { Link } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { formatMnt } from "@shared/format.js";
import { useDocumentTitle } from "../hooks.js";
import { useLang } from "../i18n.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useMeta } from "../context/MetaContext.jsx";
import { Empty, PageHead } from "../components/ui.jsx";

export default function CartPage() {
  const { t, tr, label } = useLang();
  const cart = useCart();
  const { settings } = useMeta();
  useDocumentTitle(t("cart.title"));
  const freeOver = Number(settings.free_delivery_over || 0);

  return (
    <div className="page-fade">
      <PageHead title={t("cart.title")} crumbs={[{ label: t("nav.home"), to: "/" }, { label: t("cart.title") }]} />
      <div className="container mb-4">
        {cart.items.length === 0 ? (
          <Empty icon={ShoppingCart} title={t("cart.empty")} text={t("cart.emptyText")} action={<Link to="/parts" className="btn btn-primary">{t("home.ctaParts")}</Link>} />
        ) : (
          <div className="checkout-layout">
            <div className="card">
              {cart.items.map((item) => (
                <div key={item.offerId} className="cart-line">
                  <Link to={`/parts/${item.partId}`} className="cart-line__img">{item.image && <img src={item.image} alt="" />}</Link>
                  <div className="grow">
                    <Link to={`/parts/${item.partId}`} className="strong">{tr(item)}</Link>
                    <div className="tiny muted">{item.sku} · {label("condition", item.condition)} · {item.supplier}</div>
                    <div className="row mt-2" style={{ "--gap": "10px" }}>
                      <div className="qty">
                        <button type="button" onClick={() => cart.setQuantity(item.offerId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="-"><Minus /></button>
                        <span className="num">{item.quantity}</span>
                        <button type="button" onClick={() => cart.setQuantity(item.offerId, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label="+"><Plus /></button>
                      </div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => cart.remove(item.offerId)}><Trash2 /> {t("cart.remove")}</button>
                    </div>
                  </div>
                  <div className="right">
                    <strong className="num">{formatMnt(item.price * item.quantity)}</strong>
                    {item.quantity > 1 && <div className="tiny muted num">{formatMnt(item.price)} × {item.quantity}</div>}
                  </div>
                </div>
              ))}
            </div>
            <aside className="card card-body summary">
              <h3>{t("checkout.summary")}</h3>
              <div className="sum-row"><span>{t("cart.subtotal")}</span><strong className="num">{formatMnt(cart.subtotal)}</strong></div>
              {freeOver > 0 && (
                <div className="free-ship">
                  <div className="bar"><span style={{ width: `${Math.min(100, (cart.subtotal / freeOver) * 100)}%` }} /></div>
                  <span className="tiny muted">{formatMnt(freeOver)} {t("checkout.freeOver")}</span>
                </div>
              )}
              <p className="tiny muted">{t("cart.estimateNote")}</p>
              <Link to="/checkout" className="btn btn-primary btn-lg btn-block">{t("cart.checkout")} <ArrowRight /></Link>
              <Link to="/parts" className="btn btn-ghost btn-block">{t("cart.continue")}</Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
