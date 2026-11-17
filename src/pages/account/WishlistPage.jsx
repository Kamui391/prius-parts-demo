import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { api } from "../../api.js";
import { useFetch, useDocumentTitle } from "../../hooks.js";
import { useLang } from "../../i18n.jsx";
import PartCard from "../../components/PartCard.jsx";
import { Empty, Loading } from "../../components/ui.jsx";

export default function WishlistPage() {
  const { t } = useLang();
  const { data, loading, reload } = useFetch(() => api.get("/me/wishlist"), []);
  useDocumentTitle(t("account.wishlist"));
  if (loading && !data) return <Loading />;
  return (
    <div className="stack" style={{ "--gap": "16px" }}>
      <h1>{t("account.wishlist")}</h1>
      {data.length === 0 ? <Empty icon={Heart} title={t("account.emptyWishlist")} action={<Link to="/parts" className="btn btn-primary">{t("home.ctaParts")}</Link>} /> : (
        <div className="grid grid-3">
          {data.map((part) => (
            <div key={part.id} className="stack" style={{ "--gap": "6px" }}>
              <PartCard part={part} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={async () => { await api.del(`/me/wishlist/${part.id}`); reload(); }}>{t("cart.remove")}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
