// Хоёр фронтенд (хэрэглэгч, админ) хуваалцах HTTP клиент
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
  // Талбар бүрийн алдааг { field: message } хэлбэрээр буцаана (форм дээр харуулахад)
  get fieldErrors() {
    return Object.fromEntries((this.details || []).filter((d) => d.field).map((d) => [d.field, d.message]));
  }
}

// fetchImpl: GitHub Pages демод серверийн оронд хөтөч доторх API-г дамжуулна
export function createApi({ tokenKey, onUnauthorized, fetchImpl = (...args) => fetch(...args) } = {}) {
  let token = null;
  try {
    token = localStorage.getItem(tokenKey);
  } catch {
    token = null;
  }

  const setToken = (value) => {
    token = value;
    try {
      if (value) localStorage.setItem(tokenKey, value);
      else localStorage.removeItem(tokenKey);
    } catch {
      /* хувийн цонхонд localStorage хаалттай байж болно */
    }
  };

  async function request(method, path, body, { isForm = false, raw = false } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

    let response;
    try {
      response = await fetchImpl(`/api${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, "Сервертэй холбогдож чадсангүй. Интернэт эсвэл API сервер ажиллаж байгаа эсэхийг шалгана уу.");
    }

    if (raw) return response;
    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    // JSON биш 5xx хариу = Vite proxy API серверт хүрч чадаагүй (API асаагүй байна)
    if (data === null && response.status >= 500) {
      throw new ApiError(response.status, "API сервер ажиллахгүй байна. Төслийн хавтсанд «npm run dev» командыг ажиллуулна уу.");
    }
    if (!response.ok) {
      if (response.status === 401 && token) {
        setToken(null);
        onUnauthorized?.();
      }
      throw new ApiError(response.status, data?.error || "Алдаа гарлаа", data?.details);
    }
    return data ?? {};
  }

  const qs = (params = {}) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "" || value === false) continue;
      search.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const text = search.toString();
    return text ? `?${text}` : "";
  };

  return {
    get: (path, params) => request("GET", `${path}${qs(params)}`),
    post: (path, body = {}) => request("POST", path, body),
    put: (path, body = {}) => request("PUT", path, body),
    patch: (path, body = {}) => request("PATCH", path, body),
    del: (path) => request("DELETE", path),
    upload: (path, formData) => request("POST", path, formData, { isForm: true }),
    download: async (path, params, filename) => {
      const response = await request("GET", `${path}${qs(params)}`, undefined, { raw: true });
      if (!response.ok) throw new ApiError(response.status, "Татаж авахад алдаа гарлаа");
      const url = URL.createObjectURL(await response.blob());
      const link = Object.assign(document.createElement("a"), { href: url, download: filename });
      link.click();
      URL.revokeObjectURL(url);
    },
    setToken,
    getToken: () => token,
    qs,
  };
}
