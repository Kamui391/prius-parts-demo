// Автоматаар гүйцээх хайлт: нэр, OEM дугаар, ярианы нэршил ("гупер" г.м.)
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { formatMnt } from "@shared/format.js";
import { api } from "../api.js";
import { useDebounced } from "../hooks.js";
import { useLang } from "../i18n.jsx";

export default function SearchBox({ autoFocus = false, onDone }) {
  const { t, tr } = useLang();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounced(q, 220);
  const boxRef = useRef(null);

  useEffect(() => {
    if (debounced.trim().length < 2) return setItems([]);
    let cancelled = false;
    api.get("/parts/suggest", { q: debounced }).then((list) => !cancelled && setItems(list)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onClick = (event) => !boxRef.current?.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (path) => {
    setOpen(false);
    setQ("");
    onDone?.();
    navigate(path);
  };

  const submit = (event) => {
    event.preventDefault();
    if (active >= 0 && items[active]) return go(`/parts/${items[active].id}`);
    if (q.trim()) go(`/parts?q=${encodeURIComponent(q.trim())}`);
  };

  const onKeyDown = (event) => {
    if (!items.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (event.key === "Escape") setOpen(false);
  };

  return (
    <form className="searchbox" onSubmit={submit} ref={boxRef} role="search">
      <div className="input-group">
        <Search />
        <input
          className="input"
          type="search"
          value={q}
          autoFocus={autoFocus}
          placeholder={t("common.searchPlaceholder")}
          aria-label={t("common.search")}
          aria-expanded={open && items.length > 0}
          aria-autocomplete="list"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && items.length > 0 && (
        <ul className="searchbox__list" role="listbox">
          {items.map((item, index) => (
            <li key={item.id} role="option" aria-selected={index === active}>
              <button type="button" className={`searchbox__item ${index === active ? "active" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => go(`/parts/${item.id}`)}>
                {item.image && <img src={item.image} alt="" />}
                <span className="grow">
                  <span className="truncate" style={{ display: "block" }}>{tr(item)}</span>
                  <span className="tiny muted mono">{item.oemNumber || item.sku}</span>
                </span>
                <span className="small strong num">{formatMnt(item.minPrice)}</span>
              </button>
            </li>
          ))}
          <li>
            <button type="submit" className="searchbox__all">{t("common.seeAll")} → “{q}”</button>
          </li>
        </ul>
      )}
    </form>
  );
}
