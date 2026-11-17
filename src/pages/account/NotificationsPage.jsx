import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarClock, CheckCheck, Info, MessageSquare, Receipt } from "lucide-react";
import { timeAgo } from "@shared/format.js";
import { api } from "../../api.js";
import { useFetch, useDocumentTitle } from "../../hooks.js";
import { useLang } from "../../i18n.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { Empty, Loading } from "../../components/ui.jsx";

const ICONS = { order: Receipt, booking: CalendarClock, inquiry: MessageSquare, system: Info };

export default function NotificationsPage() {
  const { t, lang } = useLang();
  const { refreshUnread } = useAuth();
  const { data, loading, reload } = useFetch(() => api.get("/me/notifications"), []);
  useDocumentTitle(t("account.notifications"));
  useEffect(() => {
    refreshUnread();
  }, [data, refreshUnread]);

  const readAll = async () => {
    await api.post("/me/notifications/read-all");
    reload();
  };
  const open = (n) => !n.isRead && api.post(`/me/notifications/${n.id}/read`).then(reload);

  if (loading && !data) return <Loading />;
  return (
    <div className="stack" style={{ "--gap": "16px" }}>
      <div className="row between">
        <h1>{t("account.notifications")}</h1>
        {data.some((n) => !n.isRead) && <button type="button" className="btn btn-outline btn-sm" onClick={readAll}><CheckCheck /> {t("account.markAllRead")}</button>}
      </div>
      {data.length === 0 ? <Empty icon={Bell} title={t("account.noNotifications")} /> : (
        <div className="card notif-list">
          {data.map((n) => {
            const IconComp = ICONS[n.type] || Info;
            const body = (
              <>
                <span className={`notif-icon ${n.type}`}><IconComp /></span>
                <span className="grow">
                  <strong className="small">{n.title}</strong>
                  {n.body && <span className="small muted" style={{ display: "block" }}>{n.body}</span>}
                  <span className="tiny muted">{timeAgo(n.createdAt, lang)}</span>
                </span>
                {!n.isRead && <span className="unread-dot" aria-label="unread" />}
              </>
            );
            return n.link ? (
              <Link key={n.id} to={n.link} className={`notif ${n.isRead ? "" : "is-unread"}`} onClick={() => open(n)}>{body}</Link>
            ) : (
              <button key={n.id} type="button" className={`notif ${n.isRead ? "" : "is-unread"}`} onClick={() => open(n)}>{body}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
