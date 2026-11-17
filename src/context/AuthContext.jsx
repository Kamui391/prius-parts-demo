import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!api.getToken()) return setUnread(0);
    try {
      const summary = await api.get("/me/summary");
      setUnread(summary.unread);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (api.getToken()) {
        try {
          const me = await api.get("/auth/me");
          if (!cancelled) setUser(me);
        } catch {
          api.setToken(null);
        }
      }
      if (!cancelled) setReady(true);
    })();
    const onLogout = () => setUser(null);
    window.addEventListener("pp:logout", onLogout);
    return () => {
      cancelled = true;
      window.removeEventListener("pp:logout", onLogout);
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    refreshUnread();
    const timer = setInterval(refreshUnread, 60000);
    return () => clearInterval(timer);
  }, [user, refreshUnread]);

  const value = useMemo(() => ({
    user,
    ready,
    unread,
    refreshUnread,
    setUser,
    async login(email, password) {
      const data = await api.post("/auth/login", { email, password });
      api.setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    async register(payload) {
      const data = await api.post("/auth/register", payload);
      api.setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    logout() {
      api.setToken(null);
      setUser(null);
      setUnread(0);
    },
  }), [user, ready, unread, refreshUnread]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
