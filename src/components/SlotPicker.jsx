// Өдөр, цагийн сонголт — ойрын 14 хоногийн сул цагийг серверээс шалгана
import { useEffect, useMemo, useState } from "react";
import { toDateInput, WEEKDAYS_EN, WEEKDAYS_MN } from "@shared/format.js";
import { api } from "../api.js";
import { useLang } from "../i18n.jsx";

export default function SlotPicker({ date, slot, onChange }) {
  const { t, lang } = useLang();
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  }), []);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const selectedDate = date || toDateInput(days[0]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get("/bookings/availability", { date: selectedDate })
      .then((data) => !cancelled && setAvailability(data))
      .catch(() => !cancelled && setAvailability(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const weekdays = lang === "mn" ? WEEKDAYS_MN : WEEKDAYS_EN;
  const freeSlots = availability?.slots.filter((s) => s.available) || [];

  return (
    <div className="slot-picker">
      <div className="day-strip" role="listbox" aria-label={t("booking.date")}>
        {days.map((d) => {
          const value = toDateInput(d);
          return (
            <button key={value} type="button" role="option" aria-selected={value === selectedDate} className={`day ${value === selectedDate ? "active" : ""}`} onClick={() => onChange({ date: value, slot: null })}>
              <span className="tiny">{weekdays[d.getDay()]}</span>
              <strong>{d.getDate()}</strong>
              <span className="tiny">{d.getMonth() + 1}{lang === "mn" ? "-р сар" : `/${d.getFullYear() % 100}`}</span>
            </button>
          );
        })}
      </div>
      <div className={`slot-grid ${loading ? "is-dim" : ""}`}>
        {availability?.closed ? (
          <p className="muted small">{t("booking.closed")}</p>
        ) : availability && freeSlots.length === 0 ? (
          <p className="muted small">{t("booking.noSlots")}</p>
        ) : (
          availability?.slots.map((s) => (
            <button key={s.time} type="button" disabled={!s.available} className={`slot ${slot === s.time ? "active" : ""}`} onClick={() => onChange({ date: selectedDate, slot: s.time })}>
              <strong>{s.time}</strong>
              <span className="tiny">{s.available ? `${s.remaining} ${t("booking.left")}` : t("booking.full")}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
