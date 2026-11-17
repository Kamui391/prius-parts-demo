import { formatDateTime } from "@shared/format.js";
import { useLang } from "../i18n.jsx";

const FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];

// Захиалгын явцыг алхмаар харуулна (хэрэглэгчийн хэсэг + нэвтрэлгүй хянах хуудас)
export default function OrderTimeline({ status, events = [] }) {
  const { label } = useLang();
  const cancelled = status === "cancelled";
  const reached = FLOW.indexOf(status);
  return (
    <div className="stack" style={{ "--gap": "18px" }}>
      {!cancelled && (
        <ol className="stepper">
          {FLOW.map((step, index) => (
            <li key={step} className={index <= reached ? "done" : ""} aria-current={index === reached ? "step" : undefined}>
              <span className="stepper__dot">{index + 1}</span>
              <span className="stepper__label">{label("orderStatus", step)}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="timeline">
        {[...events].reverse().map((event) => (
          <div key={event.id} className="timeline-item done">
            <div className="small strong">{label("orderStatus", event.status)}</div>
            {event.note && <div className="small muted">{event.note}</div>}
            <div className="tiny muted">{formatDateTime(event.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
