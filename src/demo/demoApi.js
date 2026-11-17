// =====================================================================
// GitHub Pages демо: серверийн оронд хөтөч дотор ажиллах API
// ---------------------------------------------------------------------
// Жинхэнэ REST API-ийн хариуны бүтцийг яг дуурайна. Каталог, үйлчилгээ
// зэрэг өгөгдлийг серверээс гаргасан агшин зургаас (snapshot.json) уншиж,
// хэрэглэгчийн үйлдлийг (захиалга, цаг, гараж г.м.) localStorage-д хадгална.
// =====================================================================
import QRCode from "qrcode";
import rawSnapshot from "./data/snapshot.json";

const STORE_KEY = "pp_demo_state";
const LATENCY = 150; // сүлжээний саатлыг дуурайна (ачаалж буй төлөв харагдана)

// ---------- Зургийн хаяг: /uploads/parts/x.svg → Vite-ийн бэлтгэсэн хаяг ----------
const IMAGES = Object.fromEntries(
  Object.entries(import.meta.glob("./data/parts/*.svg", { eager: true, query: "?url", import: "default" }))
    .map(([file, url]) => [file.split("/").pop(), url]),
);

// ---------- Огноо: агшин зураг авснаас хойш өнгөрсөн өдрөөр шилжүүлнэ ----------
const DAY = 86400000;
const shiftDays = Math.max(0, Math.floor((Date.now() - new Date(rawSnapshot.exportedAt).getTime()) / DAY));
const DATETIME_KEYS = new Set(["createdAt", "updatedAt", "paidAt", "lastLoginAt", "repliedAt"]);
const pad = (n) => String(n).padStart(2, "0");
const shiftDateTime = (value) => {
  const d = new Date(`${value.replace(" ", "T")}Z`);
  d.setTime(d.getTime() + shiftDays * DAY);
  return d.toISOString().slice(0, 19).replace("T", " ");
};
const shiftDate = (value) => {
  const d = new Date(`${value}T12:00:00Z`);
  d.setTime(d.getTime() + shiftDays * DAY);
  return d.toISOString().slice(0, 10);
};
function prepare(node, key) {
  if (Array.isArray(node)) return node.map((item) => prepare(item));
  if (node && typeof node === "object") return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, prepare(v, k)]));
  if (typeof node === "string") {
    if (node.startsWith("/uploads/parts/")) return IMAGES[node.split("/").pop()] || node;
    if (shiftDays && DATETIME_KEYS.has(key) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(node)) return shiftDateTime(node);
    if (shiftDays && key === "date" && /^\d{4}-\d{2}-\d{2}$/.test(node)) return shiftDate(node);
  }
  return node;
}
const snapshot = prepare(rawSnapshot);
const PARTS = new Map(snapshot.parts.map((p) => [p.id, p]));
const SETTINGS = snapshot.settings;

// ---------- Туслах функцууд ----------
const sqlNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clone = (v) => JSON.parse(JSON.stringify(v));
const digits = (s) => String(s || "").replace(/\D/g, "");
const PHONE = /^[0-9+\-\s]{8,16}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_STATUS_MN = { pending: "Хүлээгдэж буй", confirmed: "Баталгаажсан", processing: "Бэлтгэгдэж буй", shipped: "Хүргэлтэд гарсан", delivered: "Хүргэгдсэн", cancelled: "Цуцлагдсан" };
const BOOKING_STATUS_MN = { pending: "Хүлээгдэж буй", confirmed: "Баталгаажсан", in_progress: "Засвар хийгдэж буй", completed: "Дууссан", cancelled: "Цуцлагдсан" };
const money = (v) => `${Number(v).toLocaleString("en-US")}₮`;

class DemoError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
const fail = (status, message, details) => { throw new DemoError(status, message, details); };
const invalid = (details) => fail(400, "Оруулсан мэдээлэл буруу байна", details);

// ---------- Төлөв (localStorage) ----------
function initialState() {
  const d = snapshot.demoUser;
  const userId = d.user.id;
  return {
    version: rawSnapshot.exportedAt,
    seq: 1000,
    users: [{ ...d.user, password: d.password }],
    sessions: {},
    stock: {},
    reviews: [],
    vehicles: d.vehicles.map((v) => ({ ...v, userId })),
    wishlist: d.wishlist.map((partId) => ({ userId, partId })),
    orders: d.orders.map((o) => ({ ...o, userId })),
    bookings: d.bookings.map((b) => ({ ...b, userId })),
    notifications: d.notifications.map((n) => ({ ...n, userId })),
    partRequests: d.partRequests.map((r) => ({ ...r, userId })),
    inquiries: [],
    couponUses: {},
  };
}
let state;
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && saved.version === rawSnapshot.exportedAt) return saved;
  } catch {
    /* хадгалсан төлөв эвдэрсэн бол шинээр эхэлнэ */
  }
  return initialState();
}
const save = () => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* хувийн цонхонд хадгалах боломжгүй — санах ойд ажиллана */
  }
};
state = load();
const nextId = () => ++state.seq;
const makeCode = (prefix) => `${prefix}-${localDate().slice(2).replaceAll("-", "")}-${1000 + Math.floor(Math.random() * 9000)}`;
const notify = (userId, { type = "system", title, body = null, link = null }) => {
  if (!userId) return;
  state.notifications.unshift({ id: nextId(), userId, type, title, body, link, isRead: false, createdAt: sqlNow() });
};

export function resetDemo() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
  state = initialState();
}

// ---------- Каталог ----------
const SYNONYMS = [
  ["гупер", "бампер", "bumper"], ["копуд", "капот", "hood"], ["наклад", "колодка", "brake pad", "pads"],
  ["аккумлятор", "аккумулятор", "акк", "12в"], ["батерей", "батарей", "battery"], ["свечь", "свеч", "spark"],
  ["фар", "фар", "headlamp"], ["стоп", "хойд гэрэл", "tail lamp"], ["аморт", "амортизатор", "shock"],
  ["помп", "насос", "pump"], ["толь", "толь", "mirror"], ["компрессор", "компрессор", "кондиционер"], ["тос", "тос", "oil"],
];
const expand = (word) => {
  const set = new Set([word]);
  for (const group of SYNONYMS) if (group.some((t) => t.startsWith(word) || word.startsWith(t))) group.forEach((t) => set.add(t));
  return [...set];
};
const searchText = (p) => [p.nameMn, p.nameEn, p.sku, p.oemNumber, p.brand, p.descriptionMn].filter(Boolean).join(" ").toLowerCase();

function reviewsFor(part) {
  const added = state.reviews.filter((r) => r.partId === part.id);
  const replaced = new Set(added.map((r) => r.userId));
  return [...added, ...part.reviews.filter((r) => !replaced.has(r.userId))].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Агшин зураг + хэрэглэгчийн өөрчлөлт (үлдэгдэл, үнэлгээ) нэгтгэсэн бүрэн сэлбэг
function livePart(base, userId = null) {
  const part = clone(base);
  part.offers = part.offers.map((o) => ({ ...o, stock: state.stock[o.id] ?? o.stock }));
  const active = part.offers.filter((o) => o.isActive);
  part.totalStock = active.reduce((s, o) => s + o.stock, 0);
  const reviews = reviewsFor(base);
  part.reviews = reviews;
  part.reviewCount = reviews.length;
  part.rating = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : null;
  part.ratingDistribution = Object.fromEntries([5, 4, 3, 2, 1].map((star) => [star, reviews.filter((r) => r.rating === star).length]));
  part.inWishlist = Boolean(userId && state.wishlist.some((w) => w.userId === userId && w.partId === part.id));
  return part;
}
const LIST_KEYS = ["id", "sku", "oemNumber", "nameMn", "nameEn", "brand", "category", "image", "isFeatured", "isActive", "viewCount",
  "minPrice", "maxPrice", "hasDiscount", "totalStock", "offerCount", "rating", "reviewCount", "generations", "createdAt"];
const listItem = (p) => Object.fromEntries(LIST_KEYS.map((k) => [k, p[k]]));

const SORTS = {
  popular: (a, b) => b.viewCount - a.viewCount,
  price_asc: (a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity),
  price_desc: (a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
  name: (a, b) => a.nameMn.localeCompare(b.nameMn),
};
const list = (v) => String(v || "").split(",").filter(Boolean);

function listParts(q = {}) {
  let items = snapshot.parts.map((p) => livePart(p));
  if (q.q && String(q.q).trim()) {
    for (const word of String(q.q).toLowerCase().trim().split(/\s+/).slice(0, 6)) {
      const variants = expand(word);
      items = items.filter((p) => variants.some((v) => searchText(p).includes(v)));
    }
  }
  if (q.ids !== undefined) { const ids = list(q.ids).map(Number); items = items.filter((p) => ids.includes(p.id)); }
  if (q.category) { const c = list(q.category); items = items.filter((p) => c.includes(p.category.slug)); }
  if (q.generation) { const g = list(q.generation); items = items.filter((p) => p.generations.some((x) => g.includes(x))); }
  if (q.condition) { const c = list(q.condition); items = items.filter((p) => p.offers.some((o) => o.isActive && c.includes(o.condition))); }
  if (q.minPrice) items = items.filter((p) => p.minPrice >= Number(q.minPrice));
  if (q.maxPrice) items = items.filter((p) => p.minPrice <= Number(q.maxPrice));
  if (q.inStock === "1" || q.inStock === "true") items = items.filter((p) => p.totalStock > 0);
  if (q.brand) { const b = list(q.brand); items = items.filter((p) => b.includes(p.brand)); }
  if (q.featured === "1" || q.featured === "true") items = items.filter((p) => p.isFeatured);
  items.sort((a, b) => (SORTS[q.sort] || SORTS.popular)(a, b) || a.id - b.id);
  const page = Math.max(1, Number.parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(q.limit, 10) || 12));
  return {
    items: items.slice((page - 1) * limit, page * limit).map(listItem),
    total: items.length, page, limit, pages: Math.max(1, Math.ceil(items.length / limit)),
  };
}
const findPart = (idOrSku) => (/^\d+$/.test(String(idOrSku)) ? PARTS.get(Number(idOrSku)) : snapshot.parts.find((p) => p.sku === idOrSku));
const findOffer = (offerId) => {
  for (const p of snapshot.parts) {
    const o = p.offers.find((x) => x.id === offerId);
    if (o) return { part: p, offer: { ...o, stock: state.stock[o.id] ?? o.stock } };
  }
  return null;
};

// ---------- Засварын цаг ----------
function availability(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) fail(400, "Огноо YYYY-MM-DD хэлбэртэй байх ёстой");
  const capacity = Number(SETTINGS.booking_capacity || 3);
  const slots = (SETTINGS.booking_slots || "").split(",").filter(Boolean);
  const closedDays = list(SETTINGS.booking_closed_weekdays).map(Number);
  const closed = closedDays.includes(new Date(`${date}T00:00:00`).getDay());
  const today = localDate();
  const now = new Date();
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return {
    date, closed, capacity,
    slots: slots.map((time) => {
      const base = snapshot.bookingLoad.find((l) => l.date === date && l.slot === time)?.count || 0;
      const mine = state.bookings.filter((b) => b.date === date && b.timeSlot === time && b.status !== "cancelled").length;
      const remaining = Math.max(0, capacity - base - mine);
      const expired = date < today || (date === today && time <= currentTime);
      return { time, remaining, available: !closed && !expired && remaining > 0 };
    }),
  };
}
const canCancelBooking = (b) => ["pending", "confirmed"].includes(b.status) && b.date >= localDate();

function createBooking(user, input, orderCode = null) {
  const errors = [];
  if (!input.customerName || input.customerName.trim().length < 2) errors.push({ field: "customerName", message: "Нэрээ оруулна уу" });
  if (!PHONE.test(input.customerPhone || "")) errors.push({ field: "customerPhone", message: "Утасны дугаар буруу" });
  if (errors.length) invalid(errors);
  const service = snapshot.services.find((s) => s.id === Number(input.serviceId) && s.isActive);
  if (!service) fail(404, "Үйлчилгээ олдсонгүй");
  let vehicle = null;
  if (input.vehicleId) {
    vehicle = state.vehicles.find((v) => v.id === Number(input.vehicleId) && v.userId === user.id);
    if (!vehicle) fail(404, "Машин олдсонгүй");
  }
  const slot = availability(input.date).slots.find((s) => s.time === input.timeSlot);
  if (!slot) fail(400, "Ийм цаг байхгүй");
  if (!slot.available) fail(409, "Сонгосон цаг дүүрсэн эсвэл боломжгүй байна. Өөр цаг сонгоно уу.");
  const now = sqlNow();
  const booking = {
    id: nextId(), code: makeCode("SV"), userId: user.id, vehicleId: vehicle?.id || null,
    service: { id: service.id, nameMn: service.nameMn, nameEn: service.nameEn, slug: service.slug, durationMin: service.durationMin },
    technician: null, date: input.date, timeSlot: input.timeSlot, status: "pending", statusLabel: BOOKING_STATUS_MN.pending,
    customerName: input.customerName.trim(), customerPhone: input.customerPhone.trim(),
    carInfo: vehicle ? `${vehicle.generationName || "Prius"} ${vehicle.year || ""} · ${vehicle.plateNo || ""}`.replace(/\s+/g, " ").trim() : input.carInfo || null,
    note: input.note || null, estimatedPrice: service.priceFrom, finalPrice: null, adminNote: null, orderCode, createdAt: now, updatedAt: now,
  };
  state.bookings.push(booking);
  notify(user.id, { type: "booking", title: `Цаг захиалга ${booking.code} бүртгэгдлээ`, body: `${service.nameMn} · ${input.date} ${input.timeSlot}`, link: "/account/bookings" });
  return booking;
}
const bookingOut = (b) => ({ ...b, canCancel: canCancelBooking(b) });

// ---------- Засвар үйлчилгээний зөвлөх (серверийн логикийг давтана) ----------
function advice(generationCode, mileage) {
  const km = Number(mileage);
  if (!Number.isFinite(km) || km < 0 || km > 1500000) fail(400, "Гүйлтийн км буруу байна");
  const gen = snapshot.meta.generations.find((g) => g.code === generationCode);
  if (!gen) fail(404, "Приусын үе олдсонгүй");
  const PRIORITY = { high: 0, normal: 1, low: 2 };
  const ORDER = { due: 0, soon: 1, upcoming: 2, ok: 3 };
  const items = [];
  for (const r of snapshot.rules.filter((x) => !x.generation || x.generation === gen.code)) {
    let status;
    let remainingKm;
    let nextAtKm;
    if (km < r.min_km) {
      remainingKm = r.min_km - km;
      nextAtKm = r.min_km;
      if (remainingKm > 25000) continue;
      status = "upcoming";
    } else if (r.interval_km) {
      const since = (km - r.min_km) % r.interval_km;
      remainingKm = r.interval_km - since;
      nextAtKm = km + remainingKm;
      const ratio = remainingKm / r.interval_km;
      status = ratio <= 0.1 || since <= r.interval_km * 0.05 ? "due" : ratio <= 0.3 ? "soon" : "ok";
    } else {
      status = "due";
      remainingKm = 0;
      nextAtKm = km;
    }
    items.push({
      id: r.id, titleMn: r.title_mn, titleEn: r.title_en, descriptionMn: r.description_mn, descriptionEn: r.description_en,
      intervalKm: r.interval_km, priority: r.priority, generationSpecific: Boolean(r.generation), status, remainingKm, nextAtKm,
      categorySlug: r.category,
      service: r.service_slug ? { id: r.service_id, slug: r.service_slug, nameMn: r.service_mn, nameEn: r.service_en, priceFrom: r.price_from } : null,
    });
  }
  items.sort((a, b) => ORDER[a.status] - ORDER[b.status] || PRIORITY[a.priority] - PRIORITY[b.priority] || a.remainingKm - b.remainingKm);
  const urgent = [...new Set(items.filter((i) => i.status !== "ok" && i.categorySlug).map((i) => i.categorySlug))].slice(0, 4);
  return {
    generation: { code: gen.code, name: gen.name, engine: gen.engine },
    mileage: km,
    summary: Object.fromEntries(["due", "soon", "upcoming", "ok"].map((s) => [s, items.filter((i) => i.status === s).length])),
    items,
    suggestedParts: urgent.length ? listParts({ category: urgent.join(","), generation: gen.code, inStock: "1", sort: "popular", limit: 8 }).items : [],
  };
}

// ---------- Купон, хүргэлт ----------
function evaluateCoupon(code, subtotal) {
  const failed = (message) => ({ valid: false, discount: 0, message });
  if (!code) return failed();
  const c = snapshot.coupons.find((x) => x.code.toUpperCase() === String(code).trim().toUpperCase());
  const today = localDate();
  if (!c || !c.is_active) return failed("Купон олдсонгүй эсвэл идэвхгүй байна");
  if (c.starts_at && today < c.starts_at) return failed("Купоны хугацаа эхлээгүй байна");
  if (c.ends_at && today > c.ends_at) return failed("Купоны хугацаа дууссан байна");
  const used = c.used_count + (state.couponUses[c.code] || 0);
  if (c.max_uses !== null && used >= c.max_uses) return failed("Купоны ашиглах тоо дууссан байна");
  if (subtotal < c.min_total) return failed(`Купон ${c.min_total.toLocaleString("en-US")}₮-өөс дээш худалдан авалтад хүчинтэй`);
  const discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return { valid: true, discount, code: c.code, message: c.description };
}
const deliveryFee = (method, subtotal) => {
  if (method !== "delivery") return 0;
  const freeOver = Number(SETTINGS.free_delivery_over || 0);
  return freeOver && subtotal >= freeOver ? 0 : Number(SETTINGS.delivery_fee || 0);
};

// ---------- Захиалга ----------
const ORDER_TRANSITION_CANCEL = ["pending", "confirmed"];
function orderOut(o) {
  const { userId, ...rest } = o;
  return { ...rest, userId, statusLabel: ORDER_STATUS_MN[o.status], itemCount: o.items.length };
}
function createOrder(user, input) {
  const errors = [];
  if (!Array.isArray(input.items) || input.items.length === 0) errors.push({ field: "items", message: "Сагс хоосон байна" });
  if (!["delivery", "pickup", "install"].includes(input.deliveryMethod)) errors.push({ field: "deliveryMethod", message: "Хүлээн авах арга сонгоно уу" });
  if (!["qpay", "bank", "cash"].includes(input.paymentMethod)) errors.push({ field: "paymentMethod", message: "Төлбөрийн хэлбэр сонгоно уу" });
  if (!input.customerName || input.customerName.trim().length < 2) errors.push({ field: "customerName", message: "Нэрээ оруулна уу" });
  if (!PHONE.test(input.customerPhone || "")) errors.push({ field: "customerPhone", message: "Утасны дугаар буруу" });
  if (input.customerEmail && !EMAIL.test(input.customerEmail)) errors.push({ field: "customerEmail", message: "И-мэйл хаяг буруу" });
  if (input.deliveryMethod === "delivery" && !(input.district && input.address && input.address.trim().length >= 5)) {
    errors.push({ field: "address", message: "Хүргэлтийн дүүрэг, хаягаа оруулна уу" });
  }
  if (errors.length) invalid(errors);

  const lines = input.items.map((item) => {
    const found = findOffer(Number(item.offerId));
    if (!found || !found.offer.isActive) fail(409, "Сагсан дахь зарим бараа худалдаанаас хасагдсан байна");
    const qty = Number(item.quantity);
    if (found.offer.stock < qty) fail(409, `"${found.part.nameMn}" — үлдэгдэл хүрэлцэхгүй (${found.offer.stock} ширхэг үлдсэн)`);
    return { found, qty };
  });
  const subtotal = lines.reduce((s, { found, qty }) => s + found.offer.price * qty, 0);
  const fee = deliveryFee(input.deliveryMethod, subtotal);
  let discount = 0;
  let couponCode = null;
  if (input.couponCode) {
    const c = evaluateCoupon(input.couponCode, subtotal);
    if (!c.valid) fail(400, c.message);
    discount = c.discount;
    couponCode = c.code;
  }
  let installService = null;
  if (input.deliveryMethod === "install" && input.installDate && input.installSlot) {
    installService = snapshot.services.find((s) => s.slug === "part-installation");
    const slot = installService && availability(input.installDate).slots.find((s) => s.time === input.installSlot);
    if (!slot?.available) fail(400, "Суурилуулах цаг дүүрсэн байна. Өөр цаг сонгоно уу.");
  }

  const now = sqlNow();
  const code = makeCode("PP");
  const order = {
    id: nextId(), code, userId: user.id, status: "pending", paymentMethod: input.paymentMethod, paymentStatus: "unpaid",
    deliveryMethod: input.deliveryMethod, customerName: input.customerName.trim(), customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail || user.email, district: input.district || null, address: input.address || null, note: input.note || null,
    subtotal, deliveryFee: fee, discount, total: subtotal + fee - discount, couponCode, cancelReason: null, createdAt: now, updatedAt: now,
    items: lines.map(({ found, qty }) => ({
      id: nextId(), partId: found.part.id, offerId: found.offer.id, partName: found.part.nameMn, supplierName: found.offer.supplier.name,
      condition: found.offer.condition, unitPrice: found.offer.price, quantity: qty, lineTotal: found.offer.price * qty, image: found.part.images[0]?.url || null,
    })),
    events: [{ id: nextId(), status: "pending", note: "Захиалга үүслээ", createdAt: now, userName: user.name }],
    payments: [],
  };
  for (const { found, qty } of lines) state.stock[found.offer.id] = found.offer.stock - qty;
  if (couponCode) state.couponUses[couponCode] = (state.couponUses[couponCode] || 0) + 1;
  state.orders.unshift(order);
  notify(user.id, { type: "order", title: `Захиалга ${code} хүлээн авлаа`, body: "Төлбөр төлөгдсөний дараа баталгаажна.", link: `/account/orders/${code}` });
  if (installService) {
    createBooking(user, {
      serviceId: installService.id, date: input.installDate, timeSlot: input.installSlot, vehicleId: input.vehicleId,
      customerName: input.customerName, customerPhone: input.customerPhone, note: `Захиалга ${code}-ийн сэлбэг суурилуулах`,
    }, code);
  }
  return order;
}

async function paymentFor(order) {
  if (order.paymentStatus === "paid") fail(400, "Захиалгын төлбөр аль хэдийн төлөгдсөн байна");
  if (order.status === "cancelled") fail(400, "Цуцлагдсан захиалгад төлбөр үүсгэх боломжгүй");
  if (order.paymentMethod === "cash") fail(400, "Бэлэн төлбөр нь хүлээн авах үед төлөгдөнө");
  let payment = order.payments.find((p) => p.status === "pending");
  if (!payment) {
    payment = { id: nextId(), method: order.paymentMethod, amount: order.total, status: "pending", invoiceNo: `INV-${order.code.replaceAll("-", "")}-${100 + Math.floor(Math.random() * 900)}`, paidAt: null, createdAt: sqlNow() };
    order.payments.unshift(payment);
  }
  return {
    id: payment.id, method: payment.method, amount: payment.amount, status: payment.status, invoiceNo: payment.invoiceNo,
    qrImage: payment.method === "qpay" ? await QRCode.toDataURL(`qpay-sandbox://invoice/${payment.invoiceNo}?amount=${payment.amount}`, { margin: 1, width: 260 }) : null,
    bankInfo: payment.method === "bank" ? SETTINGS.bank_info : null,
    sandbox: true,
    deeplinks: payment.method === "qpay" ? ["Khan Bank", "Golomt", "TDB", "State Bank", "Xac Bank", "SocialPay"].map((name) => ({ name, link: "#" })) : [],
  };
}

// ---------- Хэрэглэгч ----------
const publicUser = (u) => { const { password, ...rest } = u; return rest; };
function passwordErrors(pw, field = "password") {
  const out = [];
  if (!pw || pw.length < 8) out.push({ field, message: "Нууц үг хамгийн багадаа 8 тэмдэгт" });
  else if (!/[A-Za-z]/.test(pw)) out.push({ field, message: "Нууц үгэнд үсэг орсон байх ёстой" });
  else if (!/\d/.test(pw)) out.push({ field, message: "Нууц үгэнд тоо орсон байх ёстой" });
  return out;
}
const newToken = (userId) => {
  const token = `demo.${userId}.${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  state.sessions[token] = userId;
  return token;
};
const vehicleOut = (v) => { const { userId, ...rest } = v; return rest; };
function vehicleFromInput(body, existing = {}) {
  const gen = snapshot.meta.generations.find((g) => g.id === Number(body.generationId));
  const errors = [];
  if (body.year && (body.year < 1997 || body.year > 2030)) errors.push({ field: "year", message: "Он буруу байна" });
  if (body.mileageKm && (body.mileageKm < 0 || body.mileageKm > 1500000)) errors.push({ field: "mileageKm", message: "Гүйлт буруу байна" });
  if (errors.length) invalid(errors);
  return {
    ...existing, generationId: gen?.id ?? null, generationCode: gen?.code ?? null, generationName: gen?.name ?? null,
    nickname: body.nickname || null, year: body.year ?? null, plateNo: body.plateNo || null,
    frameNo: body.frameNo ? String(body.frameNo).toUpperCase() : null, mileageKm: body.mileageKm ?? null,
  };
}

// =====================================================================
// Маршрутууд
// =====================================================================
const routes = [];
const route = (method, pattern, handler, { auth = false } = {}) => {
  const keys = [];
  const regex = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; })}$`);
  routes.push({ method, regex, keys, handler, auth });
};

// --- Нийтийн ---
route("GET", "/health", () => ({ ok: true, db: "browser-demo", time: new Date().toISOString() }));
route("GET", "/meta", () => snapshot.meta);
route("GET", "/parts", ({ query }) => listParts(query));
route("GET", "/parts/suggest", ({ query }) => {
  const q = String(query.q || "").trim();
  if (q.length < 2) return [];
  return listParts({ q, limit: 6, sort: "popular" }).items.map((p) => ({ id: p.id, sku: p.sku, nameMn: p.nameMn, nameEn: p.nameEn, oemNumber: p.oemNumber, minPrice: p.minPrice, image: p.image }));
});
route("GET", "/parts/:id", ({ params, user }) => {
  const base = findPart(params.id);
  if (!base) fail(404, "Сэлбэг олдсонгүй");
  const part = livePart(base, user?.id);
  part.related = part.related.map((r) => listItem(livePart(PARTS.get(r.id))));
  return part;
});
route("GET", "/services", () => snapshot.services);
route("GET", "/services/:slug", ({ params }) => snapshot.services.find((s) => s.slug === params.slug) || fail(404, "Үйлчилгээ олдсонгүй"));
route("GET", "/bookings/availability", ({ query }) => availability(String(query.date || "")));
route("GET", "/advisor", ({ query }) => advice(String(query.generation || ""), query.mileage));
route("GET", "/vehicles/decode", ({ query }) => {
  const frame = String(query.frame || "").toUpperCase().trim();
  const prefix = frame.split(/[-\s]/)[0];
  if (!/^[A-Z0-9]{4,8}$/.test(prefix)) fail(400, "Арлын (frame) дугаар буруу байна. Жишээ: ZVW30-1234567");
  const gen = snapshot.meta.generations.find((g) => g.chassis.split(",").map((c) => c.trim()).includes(prefix));
  if (!gen) return { frame, chassis: prefix, found: false };
  return {
    frame, chassis: prefix, found: true,
    generation: { id: gen.id, code: gen.code, name: gen.name, engine: gen.engine, yearFrom: gen.yearFrom, yearTo: gen.yearTo },
    compatibleParts: snapshot.parts.filter((p) => p.generations.includes(gen.code)).length,
  };
});
route("POST", "/coupons/validate", ({ body }) => {
  if (!body.code) invalid([{ field: "code", message: "Купон код оруулна уу" }]);
  const r = evaluateCoupon(body.code, Number(body.subtotal) || 0);
  return { valid: r.valid, discount: r.discount, code: r.code, message: r.message };
});
route("GET", "/orders/track", ({ query }) => {
  const code = String(query.code || "").trim().toUpperCase();
  const order = state.orders.find((o) => o.code === code);
  if (!order || !digits(query.phone) || digits(order.customerPhone) !== digits(query.phone)) fail(404, "Захиалга олдсонгүй. Код, утасны дугаараа шалгана уу.");
  return {
    code: order.code, status: order.status, statusLabel: ORDER_STATUS_MN[order.status], paymentStatus: order.paymentStatus,
    deliveryMethod: order.deliveryMethod, total: order.total, createdAt: order.createdAt, events: order.events,
    items: order.items.map((i) => ({ partName: i.partName, quantity: i.quantity })),
  };
});
route("POST", "/inquiries", ({ body, user }) => {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push({ field: "name", message: "Нэрээ оруулна уу" });
  if (!body.contact || body.contact.trim().length < 5) errors.push({ field: "contact", message: "Утас эсвэл и-мэйл оруулна уу" });
  if (!body.subject || body.subject.trim().length < 3) errors.push({ field: "subject", message: "Гарчиг оруулна уу" });
  if (!body.message || body.message.trim().length < 10) errors.push({ field: "message", message: "Мессеж хамгийн багадаа 10 тэмдэгт" });
  if (errors.length) invalid(errors);
  const id = nextId();
  state.inquiries.push({ id, userId: user?.id ?? null, ...body, createdAt: sqlNow() });
  return { status: 201, body: { id, message: "Таны хүсэлтийг хүлээн авлаа. Бид удахгүй холбогдоно." } };
});
route("POST", "/part-requests", ({ body, user }) => {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push({ field: "name", message: "Нэрээ оруулна уу" });
  if (!PHONE.test(body.phone || "")) errors.push({ field: "phone", message: "Утасны дугаар буруу" });
  if (!body.partName || body.partName.trim().length < 3) errors.push({ field: "partName", message: "Сэлбэгийн нэрээ оруулна уу" });
  if (errors.length) invalid(errors);
  const gen = snapshot.meta.generations.find((g) => g.id === Number(body.generationId));
  const code = makeCode("RQ");
  const now = sqlNow();
  state.partRequests.unshift({
    id: nextId(), code, userId: user?.id ?? null, generationId: gen?.id ?? null, generationName: gen?.name ?? null, name: body.name, phone: body.phone,
    partName: body.partName, oemNumber: body.oemNumber || null, frameNo: body.frameNo ? body.frameNo.toUpperCase() : null, note: body.note || null,
    status: "new", quotedPrice: null, adminNote: null, createdAt: now, updatedAt: now,
  });
  if (user) notify(user.id, { title: `Сэлбэгийн хүсэлт ${code} хүлээн авлаа`, body: body.partName, link: "/account/requests" });
  return { status: 201, body: { code, message: "Хүсэлтийг хүлээн авлаа. Сэлбэгийг олж, үнийн санал илгээнэ." } };
});

// --- Нэвтрэлт ---
route("POST", "/auth/register", ({ body }) => {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push({ field: "name", message: "Нэрээ оруулна уу" });
  if (!EMAIL.test(body.email || "")) errors.push({ field: "email", message: "И-мэйл хаяг буруу" });
  if (!PHONE.test(body.phone || "")) errors.push({ field: "phone", message: "Утасны дугаар буруу" });
  errors.push(...passwordErrors(body.password));
  if (errors.length) invalid(errors);
  const email = body.email.trim().toLowerCase();
  if (state.users.some((u) => u.email === email)) fail(409, "Энэ и-мэйлээр бүртгэл үүссэн байна");
  const now = sqlNow();
  const user = { id: nextId(), name: body.name.trim(), email, phone: body.phone.trim(), role: "customer", isActive: true, createdAt: now, lastLoginAt: now, password: body.password };
  state.users.push(user);
  notify(user.id, { title: "Prius Parts-д тавтай морил!", body: "Гараждаа машинаа нэмээд тохирох сэлбэгээ хурдан олоорой.", link: "/account/garage" });
  return { status: 201, body: { token: newToken(user.id), user: publicUser(user) } };
});
route("POST", "/auth/login", ({ body }) => {
  const user = state.users.find((u) => u.email === String(body.email || "").trim().toLowerCase());
  if (!user || user.password !== body.password) fail(401, "И-мэйл эсвэл нууц үг буруу байна");
  user.lastLoginAt = sqlNow();
  return { token: newToken(user.id), user: publicUser(user) };
});
route("GET", "/auth/me", ({ user }) => publicUser(user), { auth: true });
route("PUT", "/auth/me", ({ user, body }) => {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push({ field: "name", message: "Нэрээ оруулна уу" });
  if (!PHONE.test(body.phone || "")) errors.push({ field: "phone", message: "Утасны дугаар буруу" });
  if (errors.length) invalid(errors);
  user.name = body.name.trim();
  user.phone = body.phone.trim();
  return publicUser(user);
}, { auth: true });
route("PUT", "/auth/me/password", ({ user, body }) => {
  const errors = passwordErrors(body.newPassword, "newPassword");
  if (errors.length) invalid(errors);
  if (body.currentPassword !== user.password) fail(400, "Одоогийн нууц үг буруу байна");
  user.password = body.newPassword;
  return { message: "Нууц үг амжилттай солигдлоо" };
}, { auth: true });

// --- Хувийн хэсэг ---
route("GET", "/me/summary", ({ user }) => {
  const mine = (list2) => list2.filter((x) => x.userId === user.id);
  const orders = mine(state.orders);
  return {
    orders: orders.length,
    activeOrders: orders.filter((o) => ["pending", "confirmed", "processing", "shipped"].includes(o.status)).length,
    upcomingBookings: mine(state.bookings).filter((b) => ["pending", "confirmed"].includes(b.status) && b.date >= localDate()).length,
    vehicles: mine(state.vehicles).length,
    wishlist: mine(state.wishlist).length,
    unread: mine(state.notifications).filter((n) => !n.isRead).length,
    spent: orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0),
  };
}, { auth: true });

route("GET", "/me/vehicles", ({ user }) => state.vehicles.filter((v) => v.userId === user.id).map(vehicleOut), { auth: true });
route("POST", "/me/vehicles", ({ user, body }) => {
  if (state.vehicles.filter((v) => v.userId === user.id).length >= 10) fail(400, "Хамгийн ихдээ 10 машин бүртгэх боломжтой");
  const v = vehicleFromInput(body, { id: nextId(), userId: user.id, createdAt: sqlNow() });
  state.vehicles.push(v);
  return { status: 201, body: vehicleOut(v) };
}, { auth: true });
route("PUT", "/me/vehicles/:id", ({ user, body, params }) => {
  const i = state.vehicles.findIndex((v) => v.id === Number(params.id) && v.userId === user.id);
  if (i < 0) fail(404, "Машин олдсонгүй");
  state.vehicles[i] = vehicleFromInput(body, state.vehicles[i]);
  return vehicleOut(state.vehicles[i]);
}, { auth: true });
route("DELETE", "/me/vehicles/:id", ({ user, params }) => {
  const before = state.vehicles.length;
  state.vehicles = state.vehicles.filter((v) => !(v.id === Number(params.id) && v.userId === user.id));
  if (state.vehicles.length === before) fail(404, "Машин олдсонгүй");
  return { status: 204 };
}, { auth: true });

route("GET", "/me/wishlist", ({ user }) => {
  const ids = state.wishlist.filter((w) => w.userId === user.id).map((w) => w.partId);
  return ids.length ? listParts({ ids: ids.join(","), limit: 100 }).items : [];
}, { auth: true });
route("POST", "/me/wishlist/:partId", ({ user, params }) => {
  const partId = Number(params.partId);
  if (!PARTS.has(partId)) fail(404, "Сэлбэг олдсонгүй");
  if (!state.wishlist.some((w) => w.userId === user.id && w.partId === partId)) state.wishlist.push({ userId: user.id, partId });
  return { status: 201, body: { inWishlist: true } };
}, { auth: true });
route("DELETE", "/me/wishlist/:partId", ({ user, params }) => {
  state.wishlist = state.wishlist.filter((w) => !(w.userId === user.id && w.partId === Number(params.partId)));
  return { inWishlist: false };
}, { auth: true });

route("GET", "/me/notifications", ({ user }) => state.notifications.filter((n) => n.userId === user.id)
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id).slice(0, 50).map(({ userId, ...n }) => n), { auth: true });
route("POST", "/me/notifications/read-all", ({ user }) => {
  state.notifications.forEach((n) => { if (n.userId === user.id) n.isRead = true; });
  return { ok: true };
}, { auth: true });
route("POST", "/me/notifications/:id/read", ({ user, params }) => {
  const n = state.notifications.find((x) => x.id === Number(params.id) && x.userId === user.id);
  if (n) n.isRead = true;
  return { ok: true };
}, { auth: true });

route("POST", "/parts/:id/reviews", ({ user, body, params }) => {
  const part = PARTS.get(Number(params.id));
  if (!part) fail(404, "Сэлбэг олдсонгүй");
  const rating = Number(body.rating);
  if (!(rating >= 1 && rating <= 5)) invalid([{ field: "rating", message: "Үнэлгээ 1–5 байна" }]);
  const existing = state.reviews.find((r) => r.partId === part.id && r.userId === user.id) || part.reviews.some((r) => r.userId === user.id);
  state.reviews = state.reviews.filter((r) => !(r.partId === part.id && r.userId === user.id));
  const verified = state.orders.some((o) => o.userId === user.id && o.status === "delivered" && o.items.some((i) => i.partId === part.id));
  state.reviews.push({ id: nextId(), partId: part.id, userId: user.id, userName: user.name, rating, comment: body.comment || null, verified, createdAt: sqlNow() });
  return { status: existing ? 200 : 201, body: { message: existing ? "Үнэлгээ шинэчлэгдлээ" : "Үнэлгээ нэмэгдлээ" } };
}, { auth: true });

route("POST", "/orders", async ({ user, body }) => {
  const order = createOrder(user, body);
  const payment = order.paymentMethod !== "cash" ? await paymentFor(order) : null;
  return { status: 201, body: { order: orderOut(order), payment } };
}, { auth: true });
route("GET", "/me/orders", ({ user, query }) => {
  let orders = state.orders.filter((o) => o.userId === user.id);
  if (query.status) orders = orders.filter((o) => o.status === query.status);
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return {
    items: orders.slice((page - 1) * limit, page * limit).map((o) => { const { items, events, payments, ...rest } = orderOut(o); return rest; }),
    total: orders.length, page, limit, pages: Math.max(1, Math.ceil(orders.length / limit)),
  };
}, { auth: true });
const myOrder = (user, code) => state.orders.find((o) => o.code === code && o.userId === user.id) || fail(404, "Захиалга олдсонгүй");
route("GET", "/me/orders/:code", ({ user, params }) => orderOut(myOrder(user, params.code)), { auth: true });
route("POST", "/me/orders/:code/cancel", ({ user, params, body }) => {
  const order = myOrder(user, params.code);
  if (!ORDER_TRANSITION_CANCEL.includes(order.status)) fail(400, "Бэлтгэгдэж эхэлсэн захиалгыг цуцлах боломжгүй. Бидэнтэй холбогдоно уу.");
  const now = sqlNow();
  order.status = "cancelled";
  order.cancelReason = body.reason || "Хэрэглэгч цуцалсан";
  if (order.paymentStatus === "paid") order.paymentStatus = "refunded";
  order.updatedAt = now;
  for (const item of order.items) {
    const found = item.offerId && findOffer(item.offerId);
    if (found) state.stock[item.offerId] = found.offer.stock + item.quantity;
  }
  order.events.push({ id: nextId(), status: "cancelled", note: "Хэрэглэгч цуцалсан", createdAt: now, userName: user.name });
  notify(user.id, { type: "order", title: `Захиалга ${order.code}: Цуцлагдсан`, body: order.cancelReason, link: `/account/orders/${order.code}` });
  return orderOut(order);
}, { auth: true });
route("POST", "/me/orders/:code/payment", ({ user, params }) => paymentFor(myOrder(user, params.code)), { auth: true });
route("POST", "/me/payments/:id/simulate", ({ user, params }) => {
  const order = state.orders.find((o) => o.userId === user.id && o.payments.some((p) => p.id === Number(params.id))) || fail(404, "Төлбөр олдсонгүй");
  const payment = order.payments.find((p) => p.id === Number(params.id));
  if (payment.status !== "paid") {
    const now = sqlNow();
    payment.status = "paid";
    payment.paidAt = now;
    order.paymentStatus = "paid";
    if (order.status === "pending") order.status = "confirmed";
    order.updatedAt = now;
    order.events.push({ id: nextId(), status: order.status, note: `Төлбөр төлөгдлөө (${payment.invoiceNo})`, createdAt: now, userName: user.name });
    notify(user.id, { type: "order", title: `Захиалга ${order.code}: төлбөр баталгаажлаа`, body: `${money(order.total)} төлөгдлөө.`, link: `/account/orders/${order.code}` });
  }
  return orderOut(order);
}, { auth: true });

route("POST", "/bookings", ({ user, body }) => ({ status: 201, body: bookingOut(createBooking(user, body)) }), { auth: true });
route("GET", "/me/bookings", ({ user }) => state.bookings.filter((b) => b.userId === user.id)
  .sort((a, b) => `${b.date} ${b.timeSlot}`.localeCompare(`${a.date} ${a.timeSlot}`)).map(bookingOut), { auth: true });
route("POST", "/me/bookings/:code/cancel", ({ user, params }) => {
  const b = state.bookings.find((x) => x.code === params.code && x.userId === user.id) || fail(404, "Цаг захиалга олдсонгүй");
  if (!canCancelBooking(b)) fail(400, "Энэ цаг захиалгыг цуцлах боломжгүй");
  b.status = "cancelled";
  b.statusLabel = BOOKING_STATUS_MN.cancelled;
  b.updatedAt = sqlNow();
  notify(user.id, { type: "booking", title: `Цаг захиалга ${b.code}: Цуцлагдсан`, body: `${b.date} ${b.timeSlot}`, link: "/account/bookings" });
  return { ok: true };
}, { auth: true });
route("GET", "/me/part-requests", ({ user }) => state.partRequests.filter((r) => r.userId === user.id).map(({ userId, ...r }) => r), { auth: true });

// =====================================================================
// fetch-тэй ижил интерфэйс: shared/api.js үүнийг жинхэнэ fetch-ийн оронд дуудна
// =====================================================================
const json = (status, body) => new Response(status === 204 ? null : JSON.stringify(body), {
  status, headers: status === 204 ? {} : { "Content-Type": "application/json" },
});

export async function demoFetch(input, init = {}) {
  await new Promise((r) => setTimeout(r, LATENCY));
  const url = new URL(String(input), window.location.origin);
  const path = url.pathname.replace(/^.*?\/api(?=\/)/, "");
  const method = (init.method || "GET").toUpperCase();
  const query = Object.fromEntries(url.searchParams.entries());
  let body = {};
  try {
    body = init.body && typeof init.body === "string" ? JSON.parse(init.body) : {};
  } catch {
    return json(400, { error: "JSON формат буруу байна" });
  }
  const token = (init.headers?.Authorization || "").replace(/^Bearer\s+/, "");
  const user = token ? state.users.find((u) => u.id === state.sessions[token]) : null;

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = path.match(r.regex);
    if (!m) continue;
    if (r.auth && !user) return json(401, { error: "Нэвтрэх шаардлагатай" });
    try {
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const result = await r.handler({ params, query, body, user });
      save();
      if (result && typeof result === "object" && "status" in result && Number.isInteger(result.status) && Object.keys(result).every((k) => k === "status" || k === "body")) {
        return json(result.status, result.body);
      }
      return json(200, result);
    } catch (err) {
      if (err instanceof DemoError) return json(err.status, { error: err.message, details: err.details });
      console.error(err);
      return json(500, { error: "Демо горимд алдаа гарлаа" });
    }
  }
  return json(404, { error: `API зам олдсонгүй: ${method} ${path}` });
}
