// Тоо, огноо, төлөвийн нэршил — хоёр апп хуваалцана
export const formatMnt = (value) => (value === null || value === undefined ? "—" : `${Math.round(Number(value)).toLocaleString("en-US")}₮`);
export const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");
export const formatKm = (value) => (value === null || value === undefined ? "—" : `${Number(value).toLocaleString("en-US")} км`);

// Сервер UTC "YYYY-MM-DD HH:MM:SS" хэлбэрээр хадгалдаг → дотоод цагаар харуулна
export const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(`${text}T00:00:00`);
  return new Date(text.includes("T") ? text : `${text.replace(" ", "T")}Z`);
};
const pad = (n) => String(n).padStart(2, "0");
export const formatDate = (value) => {
  const d = parseDate(value);
  return d ? `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}` : "—";
};
export const formatDateTime = (value) => {
  const d = parseDate(value);
  return d ? `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : "—";
};
export const toDateInput = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const WEEKDAYS_MN = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
export const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function timeAgo(value, lang = "mn") {
  const d = parseDate(value);
  if (!d) return "";
  const sec = Math.round((Date.now() - d.getTime()) / 1000);
  const mn = lang === "mn";
  if (sec < 60) return mn ? "саяхан" : "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return mn ? `${min} минутын өмнө` : `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return mn ? `${hr} цагийн өмнө` : `${hr} h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return mn ? `${day} өдрийн өмнө` : `${day} d ago`;
  return formatDate(d);
}

export const LABELS = {
  mn: {
    orderStatus: { pending: "Хүлээгдэж буй", confirmed: "Баталгаажсан", processing: "Бэлтгэгдэж буй", shipped: "Хүргэлтэд гарсан", delivered: "Хүргэгдсэн", cancelled: "Цуцлагдсан" },
    bookingStatus: { pending: "Хүлээгдэж буй", confirmed: "Баталгаажсан", in_progress: "Засвар хийгдэж буй", completed: "Дууссан", cancelled: "Цуцлагдсан" },
    paymentStatus: { unpaid: "Төлөгдөөгүй", paid: "Төлөгдсөн", refunded: "Буцаагдсан" },
    paymentMethod: { qpay: "QPay", bank: "Дансаар шилжүүлэх", cash: "Бэлнээр (хүлээн авахдаа)" },
    deliveryMethod: { delivery: "Хүргэлт", pickup: "Дэлгүүрээс авах", install: "Сервис дээр суурилуулах" },
    condition: { new: "Шинэ", used: "Хуучин", rebuilt: "Сэргээсэн" },
    supplierType: { shop: "Дэлгүүр", garage: "Засварын газар", importer: "Импортлогч", warehouse: "Төв агуулах" },
    requestStatus: { new: "Шинэ", sourcing: "Хайж байна", quoted: "Үнийн санал өгсөн", fulfilled: "Биелсэн", closed: "Хаагдсан" },
    inquiryStatus: { new: "Шинэ", replied: "Хариулсан", closed: "Хаагдсан" },
    role: { customer: "Хэрэглэгч", staff: "Ажилтан", admin: "Админ" },
    priority: { high: "Өндөр", normal: "Дунд", low: "Бага" },
    serviceCategory: { hybrid: "Хайбрид", engine: "Хөдөлгүүр", chassis: "Явах эд анги", diagnostic: "Оношилгоо", general: "Ерөнхий" },
  },
  en: {
    orderStatus: { pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" },
    bookingStatus: { pending: "Pending", confirmed: "Confirmed", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" },
    paymentStatus: { unpaid: "Unpaid", paid: "Paid", refunded: "Refunded" },
    paymentMethod: { qpay: "QPay", bank: "Bank transfer", cash: "Cash on delivery" },
    deliveryMethod: { delivery: "Delivery", pickup: "Store pickup", install: "Install at our service" },
    condition: { new: "New", used: "Used", rebuilt: "Rebuilt" },
    supplierType: { shop: "Shop", garage: "Garage", importer: "Importer", warehouse: "Warehouse" },
    requestStatus: { new: "New", sourcing: "Sourcing", quoted: "Quoted", fulfilled: "Fulfilled", closed: "Closed" },
    inquiryStatus: { new: "New", replied: "Replied", closed: "Closed" },
    role: { customer: "Customer", staff: "Staff", admin: "Admin" },
    priority: { high: "High", normal: "Normal", low: "Low" },
    serviceCategory: { hybrid: "Hybrid", engine: "Engine", chassis: "Chassis", diagnostic: "Diagnostics", general: "General" },
  },
};

// Төлөв бүрийн өнгө (badge-ийн CSS класс)
export const STATUS_TONE = {
  pending: "warning", confirmed: "info", processing: "info", shipped: "accent", delivered: "success", cancelled: "danger",
  in_progress: "accent", completed: "success", unpaid: "warning", paid: "success", refunded: "neutral",
  new: "warning", sourcing: "info", quoted: "accent", fulfilled: "success", closed: "neutral", replied: "success",
};

export const UB_DISTRICTS = ["Баянзүрх", "Сүхбаатар", "Хан-Уул", "Баянгол", "Чингэлтэй", "Сонгинохайрхан", "Налайх", "Багануур", "Багахангай"];
