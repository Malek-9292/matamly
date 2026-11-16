import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Boxes, CalendarDays, ChartNoAxesCombined, CircleDollarSign, ClipboardList, Download, LayoutDashboard, LockKeyhole, PackagePlus, Plus, RefreshCw, Receipt, Save, Trash2, Wallet } from "lucide-react";
import * as XLSX from "xlsx";

type InventoryItem = { id: string; name: string; unit: string; quantity: number; minQuantity: number; costPerUnit: number; updatedAt: string };
type Expense = { id: string; title: string; category: string; amount: number; date: string; notes: string; createdAt: string };
type Summary = { from: string; to: string; orders: number; cancelled: number; revenue: number; expenses: number; net: number; averageOrder: number; inventoryCount: number; lowStock: number; inventoryValue: number; daily: { date: string; orders: number; revenue: number }[]; topProducts: { name: string; quantity: number }[]; lowStockItems: InventoryItem[] };
type Tab = "overview" | "inventory" | "expenses" | "reports";
const today = () => new Date().toLocaleDateString("en-CA");
const money = (n: number) => `${Number(n || 0).toFixed(3)} د.ك`;
const blankStock = { name: "", unit: "كجم", quantity: "0", minQuantity: "1", costPerUnit: "0" };

export default function Management() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [stockForm, setStockForm] = useState(blankStock);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState({ title: "", category: "مشتريات", amount: "", date: today(), notes: "" });
  const [from, setFrom] = useState(new Date(Date.now() - 29 * 86400000).toLocaleDateString("en-CA"));
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
    if (response.status === 401) { setAuthed(false); throw new Error("انتهت الجلسة، سجّل الدخول مرة أخرى"); }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "تعذر تنفيذ العملية");
    return body;
  }, []);

  const loadAll = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const [stock, costs, report] = await Promise.all([
        request("/api/inventory"), request("/api/expenses"), request(`/api/management/summary?from=${from}&to=${to}`),
      ]);
      setInventory(stock as InventoryItem[]); setExpenses(costs as Expense[]); setSummary(report as Summary);
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر تحميل البيانات"); }
    finally { setBusy(false); }
  }, [from, to, request]);

  useEffect(() => {
    request("/api/admin/session").then((x: { ok: boolean }) => setAuthed(Boolean(x.ok))).catch(() => setAuthed(false)).finally(() => setChecking(false));
  }, [request]);
  useEffect(() => { if (authed) void loadAll(); }, [authed, loadAll]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try { await request("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) }); setPassword(""); setAuthed(true); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذر تسجيل الدخول"); }
  };
  const saveStock = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    const body = { name: stockForm.name, unit: stockForm.unit, quantity: Number(stockForm.quantity), minQuantity: Number(stockForm.minQuantity), costPerUnit: Number(stockForm.costPerUnit) };
    try {
      await request(editingStock ? `/api/inventory/${editingStock}` : "/api/inventory", { method: editingStock ? "PUT" : "POST", body: JSON.stringify(body) });
      setStockForm(blankStock); setEditingStock(null); setSuccess("تم حفظ بيانات المخزون"); await loadAll();
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر حفظ الصنف"); }
  };
  const adjustStock = async (item: InventoryItem, delta: number) => {
    try { await request(`/api/inventory/${item.id}/adjust`, { method: "PATCH", body: JSON.stringify({ delta }) }); await loadAll(); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذر تعديل الكمية"); }
  };
  const deleteStock = async (item: InventoryItem) => {
    if (!window.confirm(`حذف ${item.name} من المخزون؟`)) return;
    try { await request(`/api/inventory/${item.id}`, { method: "DELETE" }); await loadAll(); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذر حذف الصنف"); }
  };
  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    try { await request("/api/expenses", { method: "POST", body: JSON.stringify({ ...expenseForm, amount: Number(expenseForm.amount) }) }); setExpenseForm({ title: "", category: "مشتريات", amount: "", date: today(), notes: "" }); setSuccess("تم تسجيل المصروف"); await loadAll(); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذر تسجيل المصروف"); }
  };
  const deleteExpense = async (expense: Expense) => {
    if (!window.confirm(`حذف المصروف «${expense.title}»؟`)) return;
    try { await request(`/api/expenses/${expense.id}`, { method: "DELETE" }); await loadAll(); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذر حذف المصروف"); }
  };
  const filteredStock = useMemo(() => inventory.filter(x => x.name.toLocaleLowerCase("ar").includes(search.toLocaleLowerCase("ar"))), [inventory, search]);
  const exportReport = () => {
    if (!summary) return;
    const rows = [
      ["التاريخ", "عدد الطلبات", "المبيعات (د.ك)"],
      ...summary.daily.map(x => [x.date, x.orders, x.revenue]),
      [], ["إجمالي الطلبات", summary.orders], ["المبيعات", summary.revenue], ["المصروفات", summary.expenses], ["الصافي قبل تكلفة البضاعة", summary.net],
    ];
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "التقرير"); XLSX.writeFile(workbook, `matamly-report-${from}-${to}.xlsx`);
  };

  if (checking) return <div className="ops-loading">جارٍ التحقق من الجلسة…</div>;
  if (!authed) return <div className="ops-login" dir="rtl"><form className="ops-login-card" onSubmit={login}><div className="ops-logo"><LockKeyhole/></div><span>مطعمي · الإدارة</span><h1>المخزون والتقارير</h1><p>سجّل الدخول باستخدام كلمة مرور لوحة الإدارة.</p><label>كلمة المرور<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus/></label>{error && <div className="ops-alert error">{error}</div>}<button className="ops-primary">دخول</button><a href="/admin">العودة للوحة الإدارة</a></form></div>;

  const nav: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "نظرة عامة", icon: LayoutDashboard }, { id: "inventory", label: "المخزون", icon: Boxes }, { id: "expenses", label: "المصروفات", icon: Wallet }, { id: "reports", label: "التقارير", icon: ChartNoAxesCombined },
  ];
  return <div className="ops-shell" dir="rtl">
    <aside className="ops-sidebar"><a className="ops-brand" href="/admin"><span>م</span><div><b>مطعمي</b><small>إدارة التشغيل</small></div></a><nav>{nav.map(n => { const Icon = n.icon; return <button key={n.id} className={tab === n.id ? "active" : ""} onClick={() => setTab(n.id)}><Icon size={18}/>{n.label}</button>; })}</nav><div className="ops-sidebar-foot"><a href="/cashier">فتح الكاشير ↗</a><a href="/admin">لوحة الموقع ↗</a></div></aside>
    <main className="ops-main"><header className="ops-header"><div><span>نظام إدارة المطعم</span><h1>{nav.find(n => n.id === tab)?.label}</h1></div><div className="ops-header-actions"><span className="ops-live"><i/> النظام متصل</span><button className="ops-light-btn" onClick={() => void loadAll()}><RefreshCw size={16} className={busy ? "ops-spin" : ""}/> تحديث</button></div></header>
      {error && <div className="ops-alert error">{error}</div>}{success && <div className="ops-alert success">{success}</div>}
      {tab === "overview" && <>
        <section className="ops-kpis"><Kpi icon={<CircleDollarSign/>} label="المبيعات خلال الفترة" value={money(summary?.revenue || 0)} tone="green"/><Kpi icon={<Receipt/>} label="المصروفات المسجلة" value={money(summary?.expenses || 0)} tone="orange"/><Kpi icon={<Wallet/>} label="الصافي بعد المصروفات" value={money(summary?.net || 0)} tone="blue"/><Kpi icon={<ClipboardList/>} label="الطلبات المكتملة وغير الملغاة" value={String(summary?.orders || 0)} tone="purple"/></section>
        <section className="ops-overview-grid"><div className="ops-panel"><div className="ops-panel-title"><div><small>حركة المبيعات</small><h2>ملخص الفترة</h2></div><Activity/></div><div className="ops-bars">{(summary?.daily || []).slice(-14).map(day => <div className="ops-bar-col" key={day.date} title={`${day.date}: ${money(day.revenue)}`}><div style={{ height: `${Math.max(4, day.revenue / Math.max(1, ...(summary?.daily || []).map(x => x.revenue)) * 100)}%` }}/><small>{day.date.slice(5)}</small></div>)}{!summary?.daily.length && <p className="ops-empty">لا توجد مبيعات مسجلة في هذه الفترة.</p>}</div></div>
          <div className="ops-panel"><div className="ops-panel-title"><div><small>تنبيهات المخزون</small><h2>أصناف تحتاج متابعة</h2></div><AlertTriangle/></div>{summary?.lowStockItems.length ? summary.lowStockItems.slice(0, 6).map(x => <div className="ops-low-row" key={x.id}><span>{x.name}</span><b>{x.quantity} {x.unit}</b><small>الحد الأدنى {x.minQuantity}</small></div>) : <p className="ops-empty">لا توجد أصناف منخفضة حالياً.</p>}<button className="ops-text-btn" onClick={() => setTab("inventory")}>إدارة المخزون ←</button></div></section>
        <section className="ops-panel ops-top-products"><div className="ops-panel-title"><div><small>الأكثر طلباً</small><h2>الأصناف الأعلى مبيعاً</h2></div><ArrowUpCircle/></div>{summary?.topProducts.length ? summary.topProducts.map((x, i) => <div className="ops-rank-row" key={x.name}><span>{i + 1}</span><b>{x.name}</b><strong>{x.quantity} وحدة</strong></div>) : <p className="ops-empty">ستظهر الأصناف بعد تسجيل الطلبات.</p>}</section>
      </>}
      {tab === "inventory" && <>
        <section className="ops-panel"><div className="ops-panel-title"><div><small>متابعة الكميات والتكلفة</small><h2>{editingStock ? "تعديل صنف مخزون" : "إضافة صنف للمخزون"}</h2></div><PackagePlus/></div><form className="ops-form-grid" onSubmit={saveStock}><label>اسم الصنف<input value={stockForm.name} onChange={e => setStockForm({ ...stockForm, name: e.target.value })} placeholder="مثال: دجاج طازج" required minLength={2}/></label><label>وحدة القياس<input value={stockForm.unit} onChange={e => setStockForm({ ...stockForm, unit: e.target.value })} placeholder="كجم / حبة / لتر" required/></label><label>الكمية الحالية<input type="number" min="0" step="0.001" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} required/></label><label>حد التنبيه الأدنى<input type="number" min="0" step="0.001" value={stockForm.minQuantity} onChange={e => setStockForm({ ...stockForm, minQuantity: e.target.value })} required/></label><label>تكلفة الوحدة (د.ك)<input type="number" min="0" step="0.001" value={stockForm.costPerUnit} onChange={e => setStockForm({ ...stockForm, costPerUnit: e.target.value })} required/></label><div className="ops-form-actions"><button className="ops-primary"><Save size={16}/>{editingStock ? "حفظ التعديل" : "إضافة للمخزون"}</button>{editingStock && <button type="button" className="ops-light-btn" onClick={() => { setEditingStock(null); setStockForm(blankStock); }}>إلغاء</button>}</div></form></section>
        <section className="ops-panel"><div className="ops-panel-title"><div><small>{inventory.length} أصناف مسجلة</small><h2>رصيد المخزون</h2></div><label className="ops-search">بحث<input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم الصنف"/></label></div><div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>الصنف</th><th>الكمية</th><th>الحد الأدنى</th><th>تكلفة الوحدة</th><th>قيمة المخزون</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{filteredStock.map(item => <tr key={item.id}><td><b>{item.name}</b><small>{item.unit}</small></td><td>{item.quantity} {item.unit}</td><td>{item.minQuantity}</td><td>{money(item.costPerUnit)}</td><td>{money(item.quantity * item.costPerUnit)}</td><td><span className={`ops-stock-badge ${item.quantity <= item.minQuantity ? "low" : "good"}`}>{item.quantity <= item.minQuantity ? "منخفض" : "متوفر"}</span></td><td><div className="ops-row-actions"><button title="صرف وحدة" onClick={() => void adjustStock(item, -1)} disabled={item.quantity < 1}><ArrowDownCircle/></button><button title="إضافة وحدة" onClick={() => void adjustStock(item, 1)}><ArrowUpCircle/></button><button title="تعديل" onClick={() => { setEditingStock(item.id); setStockForm({ name: item.name, unit: item.unit, quantity: String(item.quantity), minQuantity: String(item.minQuantity), costPerUnit: String(item.costPerUnit) }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Save/></button><button title="حذف" className="danger" onClick={() => void deleteStock(item)}><Trash2/></button></div></td></tr>)}</tbody></table>{!filteredStock.length && <p className="ops-empty">لا توجد أصناف مطابقة. أضف أول صنف من النموذج أعلاه.</p>}</div><p className="ops-hint">ملاحظة: حركة المخزون هنا يدوية؛ لم يتم ربط خصم المكونات تلقائياً بالوصفات حتى لا تُخصم كميات غير مؤكدة.</p></section>
      </>}
      {tab === "expenses" && <>
        <section className="ops-panel"><div className="ops-panel-title"><div><small>سجّل مصروفات التشغيل</small><h2>إضافة مصروف جديد</h2></div><Wallet/></div><form className="ops-form-grid" onSubmit={saveExpense}><label>بيان المصروف<input value={expenseForm.title} onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} placeholder="مثال: شراء خضروات" required minLength={2}/></label><label>التصنيف<select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>{["مشتريات", "رواتب", "إيجار", "كهرباء وماء", "توصيل", "صيانة", "تسويق", "أخرى"].map(x => <option key={x}>{x}</option>)}</select></label><label>المبلغ (د.ك)<input type="number" min="0.001" step="0.001" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required/></label><label>التاريخ<input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required/></label><label className="ops-wide-field">ملاحظات<textarea value={expenseForm.notes} onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })} rows={2}/></label><div className="ops-form-actions"><button className="ops-primary"><Plus size={16}/> تسجيل المصروف</button></div></form></section>
        <section className="ops-panel"><div className="ops-panel-title"><div><small>{expenses.length} مصروفات مسجلة</small><h2>سجل المصروفات</h2></div><b className="ops-expense-total">{money(expenses.reduce((s, x) => s + x.amount, 0))}</b></div><div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>التاريخ</th><th>البيان</th><th>التصنيف</th><th>ملاحظات</th><th>المبلغ</th><th></th></tr></thead><tbody>{expenses.map(x => <tr key={x.id}><td>{x.date}</td><td><b>{x.title}</b></td><td>{x.category}</td><td>{x.notes || "—"}</td><td><strong>{money(x.amount)}</strong></td><td><button className="ops-icon-danger" onClick={() => void deleteExpense(x)} title="حذف"><Trash2 size={16}/></button></td></tr>)}</tbody></table>{!expenses.length && <p className="ops-empty">لم يتم تسجيل مصروفات حتى الآن.</p>}</div></section>
      </>}
      {tab === "reports" && <>
        <section className="ops-panel"><div className="ops-panel-title"><div><small>حدد فترة التقرير</small><h2>تقارير المبيعات والأرباح</h2></div><Download/></div><div className="ops-period"><label>من تاريخ<input type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><label>إلى تاريخ<input type="date" value={to} onChange={e => setTo(e.target.value)}/></label><button className="ops-primary" onClick={() => void loadAll()}><CalendarDays size={16}/> تطبيق الفترة</button><button className="ops-light-btn" onClick={exportReport}><Download size={16}/> تصدير Excel</button></div></section>
        <section className="ops-kpis"><Kpi icon={<CircleDollarSign/>} label="إجمالي المبيعات" value={money(summary?.revenue || 0)} tone="green"/><Kpi icon={<Wallet/>} label="المصروفات" value={money(summary?.expenses || 0)} tone="orange"/><Kpi icon={<ChartNoAxesCombined/>} label="الصافي التشغيلي" value={money(summary?.net || 0)} tone="blue"/><Kpi icon={<ClipboardList/>} label="متوسط الطلب" value={money(summary?.averageOrder || 0)} tone="purple"/></section>
        <section className="ops-panel"><div className="ops-panel-title"><div><small>تفاصيل يومية</small><h2>المبيعات حسب اليوم</h2></div></div><div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>التاريخ</th><th>عدد الطلبات</th><th>المبيعات</th></tr></thead><tbody>{summary?.daily.map(x => <tr key={x.date}><td>{x.date}</td><td>{x.orders}</td><td><b>{money(x.revenue)}</b></td></tr>)}</tbody></table>{!summary?.daily.length && <p className="ops-empty">لا توجد بيانات للفترة المحددة.</p>}</div><p className="ops-hint">الصافي المعروض = المبيعات − المصروفات المسجلة فقط. لا يشمل تكلفة المكونات أو الضرائب أو رسوم بوابة الدفع ما لم تُسجّل كمصروفات.</p></section>
      </>}
    </main>
  </div>;
}

function Kpi({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return <article className="ops-kpi"><span className={`ops-kpi-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}
