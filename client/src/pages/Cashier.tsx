import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check, ChefHat, Clock3, LockKeyhole, Printer, RefreshCw,
  Search, Volume2, VolumeX, XCircle,
} from "lucide-react";

type OrderItem = { name: string; qty: number; price: number; choices?: string[] };
type Order = {
  id: number;
  orderNumber: number;
  createdAt: string;
  customer: { name: string; phone: string };
  items: OrderItem[];
  foodTotal: number;
  deliveryFee: number;
  total: number;
  zone: string;
  address: string;
  notes: string;
  payment: string;
  serviceMode: "pickup" | "delivery";
  status: "new" | "processing" | "ready" | "completed" | "cancelled";
  printStatus: "pending" | "printing" | "printed" | "failed" | "none";
  printError: string;
};
type Filter = "all" | Order["status"];
const money = (n: number) => `${Number(n || 0).toFixed(3)} د.ك`;
const statusLabels: Record<Order["status"], string> = {
  new: "جديد", processing: "قيد التجهيز", ready: "جاهز", completed: "مكتمل", cancelled: "ملغي",
};
const printLabels: Record<Order["printStatus"], string> = {
  pending: "بانتظار الطباعة", printing: "جارٍ الإرسال للطابعة", printed: "تم إرسال الطلب للطابعة", failed: "فشلت الطباعة", none: "بدون مهمة طباعة",
};

export default function Cashier() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [printId, setPrintId] = useState<number | null>(null);
  const [sound, setSound] = useState(() => localStorage.getItem("matamly_cashier_sound") !== "0");
  const [error, setError] = useState("");

  const playNewOrder = () => {
    if (!sound) return;
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      [660, 880].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.frequency.value = frequency;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + index * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.18 + 0.16);
        oscillator.connect(gain); gain.connect(ctx.destination);
        oscillator.start(ctx.currentTime + index * 0.18);
        oscillator.stop(ctx.currentTime + index * 0.18 + 0.17);
      });
      window.setTimeout(() => void ctx.close(), 900);
    } catch { /* الصوت ميزة اختيارية */ }
  };

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (response.status === 401) { setAuthed(false); return; }
      if (!response.ok) throw new Error("تعذر تحميل الطلبات");
      const next = await response.json() as Order[];
      setOrders(previous => {
        const previousIds = new Set(previous.map(order => order.id));
        if (previous.length && next.some(order => !previousIds.has(order.id) && order.status === "new")) playNewOrder();
        return next;
      });
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "الخادم غير متاح");
    } finally { setLoading(false); }
  }, [sound]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const response = await fetch("/api/cashier/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
      });
      if (response.ok) { setAuthed(true); setPassword(""); }
      else setError(response.status === 429 ? "محاولات كثيرة. حاول بعد قليل." : "كلمة المرور غير صحيحة");
    } catch { setError("تعذر الاتصال بالخادم"); }
  };

  useEffect(() => {
    fetch("/api/staff/session", { cache: "no-store" }).then(r => r.json()).then(x => setAuthed(Boolean(x.ok))).catch(() => setAuthed(false));
  }, []);
  useEffect(() => {
    if (!authed) return;
    void load();
    const timer = window.setInterval(() => void load(true), 4000);
    return () => window.clearInterval(timer);
  }, [authed, load]);
  useEffect(() => {
    if (!printId) return;
    const afterPrint = () => setPrintId(null);
    window.addEventListener("afterprint", afterPrint);
    const timer = window.setTimeout(() => window.print(), 80);
    return () => { window.clearTimeout(timer); window.removeEventListener("afterprint", afterPrint); };
  }, [printId]);

  const updateStatus = async (id: number, status: Order["status"]) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "لم يتم تحديث حالة الطلب");
      await load(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "تعذر تحديث الطلب"); }
  };
  const reprint = async (id: number) => {
    try {
      const response = await fetch(`/api/orders/${id}/reprint`, { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "تعذرت إعادة الطباعة");
      await load(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "تعذرت إعادة الطباعة"); }
  };

  const counts = useMemo(() => ({
    all: orders.length,
    new: orders.filter(o => o.status === "new").length,
    processing: orders.filter(o => o.status === "processing").length,
    ready: orders.filter(o => o.status === "ready").length,
    completed: orders.filter(o => o.status === "completed").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  }), [orders]);
  const visibleOrders = useMemo(() => orders.filter(order => {
    const matchesFilter = filter === "all" || order.status === filter;
    const query = search.trim().toLocaleLowerCase("ar");
    const matchesSearch = !query || [order.customer.name, order.customer.phone, String(order.orderNumber), order.zone].some(value => String(value || "").toLocaleLowerCase("ar").includes(query));
    return matchesFilter && matchesSearch;
  }), [orders, filter, search]);

  if (!authed) return <div className="admin-login"><div className="login-card"><div className="login-logo"><LockKeyhole /></div><span className="eyebrow">نقطة الكاشير</span><h1>تسجيل دخول الكاشير</h1><p>استخدم كلمة مرور الكاشير. كلمة مرور الإدارة تعمل هنا أيضاً، لكنها لا تمنح الكاشير صلاحية تعديل المنيو أو الأسعار.</p><form onSubmit={login}><label>كلمة المرور<input autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <p className="cashier-error">{error}</p>}<button className="primary-btn wide">دخول الكاشير</button></form><a href="/" className="back-link">العودة للموقع</a></div></div>;

  return <div className="cashier-shell">
    <header className="cashier-header"><div><span className="eyebrow">نقطة الكاشير · تحديث تلقائي كل 4 ثوانٍ</span><h1>إدارة الطلبات</h1><p className="cashier-header-sub">الطلبات تبقى في السجل بعد التجهيز والطباعة.</p></div><div className="cashier-header-actions"><button className="outline-btn" onClick={() => { const next = !sound; setSound(next); localStorage.setItem("matamly_cashier_sound", next ? "1" : "0"); }}>{sound ? <Volume2 size={16}/> : <VolumeX size={16}/>} {sound ? "الصوت يعمل" : "الصوت مغلق"}</button><button className="outline-btn" onClick={() => void load()}><RefreshCw size={16} className={loading ? "cashier-spin" : ""}/> {loading ? "تحديث..." : "تحديث"}</button></div></header>
    <main className="cashier-main cashier-dashboard">
      {error && <div className="cashier-error"><XCircle size={17}/>{error}</div>}
      <section className="cashier-toolbar"><div className="cashier-filters">
        {([["all", "السجل"], ["new", "جديدة"], ["processing", "تجهيز"], ["ready", "جاهزة"], ["completed", "مكتملة"], ["cancelled", "ملغاة"]] as [Filter, string][]).map(([key, label]) => <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>{label}<b>{counts[key]}</b></button>)}
      </div><label className="cashier-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو رقم الطلب" /></label></section>
      {visibleOrders.length === 0 ? <div className="cashier-empty"><Check size={42}/><h2>{orders.length ? "لا توجد نتائج مطابقة" : "لا توجد طلبات حالياً"}</h2></div> : visibleOrders.map(order => <article className={`cashier-order ${order.status} ${printId && printId !== order.id ? "print-hidden" : ""}`} key={order.id}>
        <div className="order-head"><div><span className="eyebrow">طلب رقم {order.orderNumber}</span><h2>{order.customer.name}</h2><p><Clock3 size={13}/> {new Date(order.createdAt).toLocaleString("ar-KW")} · {order.customer.phone}</p></div><span className={`order-status status-${order.status}`}>{statusLabels[order.status]}</span></div>
        <div className="order-meta"><strong>{order.serviceMode === "delivery" ? "توصيل" : "استلام من المطعم"}</strong>{order.serviceMode === "delivery" && <span>{order.zone || "بدون منطقة"} · {order.address || "بدون عنوان"}</span>}{order.notes && <span>ملاحظات: {order.notes}</span>}<span className={`print-state print-${order.printStatus}`}>{printLabels[order.printStatus]}{order.printError ? ` — ${order.printError}` : ""}</span></div>
        <div className="order-items">{order.items.map((item, index) => <div className="cashier-item" key={`${order.id}-${index}`}><div><strong>{item.qty} × {item.name}</strong>{item.choices?.length ? <small>{item.choices.join("، ")}</small> : null}</div><span>{money(item.price * item.qty)}</span></div>)}</div>
        <div className="order-total"><div><span>الطعام {money(order.foodTotal)}</span><span>التوصيل {money(order.deliveryFee)}</span><span>الدفع: {order.payment || "عند الاستلام"}</span></div><strong>{money(order.total)}</strong></div>
        <div className="order-actions">
          <button className="outline-btn" onClick={() => void reprint(order.id)}><Printer size={17}/> إعادة طباعة</button>
          <button className="outline-btn" onClick={() => setPrintId(order.id)}>طباعة عبر نظام التشغيل</button>
          {order.status === "new" && <button className="primary-btn" onClick={() => void updateStatus(order.id, "processing")}><ChefHat size={17}/> بدء التجهيز</button>}
          {order.status === "processing" && <button className="primary-btn" onClick={() => void updateStatus(order.id, "ready")}>جاهز</button>}
          {order.status === "ready" && <button className="primary-btn" onClick={() => void updateStatus(order.id, "completed")}><Check size={17}/> مكتمل</button>}
          {order.status !== "cancelled" && order.status !== "completed" && <button className="cashier-cancel-btn" onClick={() => { if (window.confirm("هل تريد إلغاء هذا الطلب؟")) void updateStatus(order.id, "cancelled"); }}><XCircle size={16}/> إلغاء</button>}
        </div>
      </article>)}
    </main>
  </div>;
}
