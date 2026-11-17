import { Link } from "react-router-dom";
import { MapPinOff } from "lucide-react";
import { useLang } from "../i18n.jsx";
import { Empty } from "../components/ui.jsx";

export default function NotFoundPage() {
  const { t } = useLang();
  return (
    <div className="container mt-5 mb-5">
      <Empty icon={MapPinOff} title={`404 — ${t("common.notFound")}`} action={<Link to="/" className="btn btn-primary">{t("nav.home")}</Link>} />
    </div>
  );
}
