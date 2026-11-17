import { createApi } from "@shared/api.js";

// VITE_DEMO=true үед (GitHub Pages) сервергүй, хөтөч доторх демо API ажиллана
export const IS_DEMO = import.meta.env.VITE_DEMO === "true";
const demoFetch = async (...args) => (await import("./demo/demoApi.js")).demoFetch(...args);

export const api = createApi({
  tokenKey: "pp_token",
  onUnauthorized: () => window.dispatchEvent(new Event("pp:logout")),
  ...(IS_DEMO ? { fetchImpl: demoFetch } : {}),
});
