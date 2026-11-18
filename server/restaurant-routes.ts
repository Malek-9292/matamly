import crypto from "node:crypto";
import { validPlatform, validConnection, validStage, type PrintStage } from "./print-core/protocol";
import { customerAccountId, getCustomerAccountStats, registerCustomerAccountRoutes } from "./customer-account";
import type express from "express";
import {
  RestaurantError,
  claimPrintJob,
  createCustomerOrder,
  createStaffSession,
  deleteArea,
  deleteGroup,
  deleteStaffSession,
  finishPrintJob,
  getJsonDocument,
  getMenu,
  getProductRatingSummary,
  getRateableOrder,
  submitProductRating,
  getSettings,
  initRestaurant,
  listAreaModel,
  listOrders,
  readStaffSession,
  reprintOrder,
  retryPrintJob,
  pairPrintDevice,
  authenticatePrintDevice,
  heartbeatPrintDevice,
  listPrintDevices,
  addPrintPrinter,
  updatePrintPrinter,
  revokePrintDevice,
  claimUniversalPrintJob,
  recordUniversalPrintStage,
  listPrintJobEvents,
  saveArea,
  saveGroup,
  saveJsonDocument,
  saveMenu,
  saveSettings,
  updateOrderStatus,
} from "./restaurant-db";

export { initRestaurant };

const cookieName = "restaurant_staff_session";
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const orderAttempts = new Map<string, { count: number; resetAt: number }>();

function cookieOptions() {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `HttpOnly; Path=/; SameSite=Lax; ${secure}Max-Age=86400`;
}

function readToken(req: express.Request) {
  return req.headers.cookie?.match(new RegExp(`(?:^|; )${cookieName}=([a-f0-9]+)`))?.[1] || "";
}

function passwordsMatch(expected: string, received: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
}

function limited(map: Map<string, { count: number; resetAt: number }>, key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = map.get(key);
  if (current && current.resetAt > now && current.count >= max) return current.resetAt - now;
  map.set(key, current && current.resetAt > now ? { count: current.count + 1, resetAt: current.resetAt } : { count: 1, resetAt: now + windowMs });
  return 0;
}

async function roleOf(req: express.Request) {
  const token = readToken(req);
  if (!token) return null;
  return readStaffSession(token);
}

function deviceToken(req: express.Request) {
  const header = req.header("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function agentAuthorized(req: express.Request) {
  const expected = process.env.PRINT_AGENT_TOKEN || "";
  const header = req.header("authorization") || "";
  const received = header.startsWith("Bearer ") ? header.slice(7) : "";
  return passwordsMatch(expected, received);
}

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanNumber(value: unknown, max = 1_000_000) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= max ? number : null;
}


function kuwaitMinutesNow() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuwait", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

function clockMinutes(value: unknown, fallback: string) {
  const clock = typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback;
  const [hour, minute] = clock.split(":").map(Number);
  return hour * 60 + minute;
}

function isWithinOvernightWindow(now: number, start: number, end: number) {
  return start < end ? now >= start && now < end : now >= start || now < end;
}

async function sendError(res: express.Response, error: unknown) {
  if (error instanceof RestaurantError) return res.status(error.status).json({ ok: false, message: error.message });
  console.error(error);
  return res.status(500).json({ ok: false, message: "تعذر تنفيذ العملية" });
}

export function registerRestaurantRoutes(app: express.Express) {
  registerCustomerAccountRoutes(app);
  app.get("/api/admin/customer-stats", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(401).json({ ok: false });
    try { res.setHeader("Cache-Control", "no-store"); return res.json({ ok: true, stats: await getCustomerAccountStats() }); }
    catch (error) { return sendError(res, error); }
  });
  app.post("/api/orders", async (req, res) => {
    const wait = limited(orderAttempts, req.ip || "unknown", 20, 10 * 60 * 1000);
    if (wait) {
      res.setHeader("Retry-After", String(Math.ceil(wait / 1000)));
      return res.status(429).json({ ok: false, message: "طلبات كثيرة. حاول بعد قليل." });
    }
    try {
      const { settings } = await getSettings();
      const now = kuwaitMinutesNow();
      const open = clockMinutes(settings.matamly_open_time, "06:30");
      const close = clockMinutes(settings.matamly_close_time, "00:30");
      const deliveryStart = clockMinutes(settings.matamly_delivery_start_time, "11:30");
      if (!isWithinOvernightWindow(now, open, close)) {
        return res.status(403).json({ ok: false, message: `المطعم مغلق حالياً. مواعيد العمل من ${settings.matamly_open_time || "06:30"} إلى ${settings.matamly_close_time || "00:30"}` });
      }
      const serviceMode = req.body?.serviceMode;
      if (serviceMode === "delivery" && !isWithinOvernightWindow(now, deliveryStart, close)) {
        return res.status(403).json({ ok: false, message: `التوصيل يبدأ الساعة ${settings.matamly_delivery_start_time || "11:30"}` });
      }
      const accountId = await customerAccountId(req);
      const order = await createCustomerOrder({ ...(req.body ?? {}), customerAccountId: accountId });
      return res.status(201).json({ ok: true, id: order.id, orderNumber: order.orderNumber, total: order.total, foodTotal: order.foodTotal, deliveryFee: order.deliveryFee, items: order.items });
    } catch (error) { return sendError(res, error); }
  });

  app.get("/api/orders", async (req, res) => {
    const role = await roleOf(req);
    if (!role) return res.status(401).json({ ok: false });
    res.setHeader("Cache-Control", "no-store");
    try { res.json(await listOrders()); } catch (error) { await sendError(res, error); }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const role = await roleOf(req);
    if (!role) return res.status(401).json({ ok: false });
    try { res.json({ ok: true, order: await updateOrderStatus(Number(req.params.id), cleanText(req.body?.status, 20)) }); }
    catch (error) { await sendError(res, error); }
  });

  app.post("/api/orders/:id/reprint", async (req, res) => {
    const role = await roleOf(req);
    if (!role) return res.status(401).json({ ok: false });
    try { res.json({ ok: true, order: await reprintOrder(Number(req.params.id)) }); }
    catch (error) { await sendError(res, error); }
  });

  app.get("/api/settings", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const data = await getSettings();
      res.json(data);
    } catch (error) { await sendError(res, error); }
  });

  app.put("/api/settings", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false, message: "هذا الإجراء للإدارة فقط" });
    const incoming = req.body?.settings;
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return res.status(400).json({ ok: false, message: "الإعدادات غير صحيحة" });
    try {
      const result = await saveSettings(incoming, Number(req.body?.revision));
      if (result.conflict) return res.status(409).json({ ok: false, message: "تغيرت الإعدادات من جهاز آخر. أعد تحميل الصفحة قبل الحفظ.", revision: result.revision });
      res.json({ ok: true, revision: result.revision });
    } catch (error) { await sendError(res, error); }
  });

  app.get("/api/product-ratings", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try { res.json({ ratings: await getProductRatingSummary() }); }
    catch (error) { await sendError(res, error); }
  });

  app.get("/api/product-ratings/order/:orderNumber", async (req, res) => {
    try {
      const items = await getRateableOrder({
        orderNumber: Number(req.params.orderNumber),
        phone: cleanText(req.query.phone, 30),
      });
      res.setHeader("Cache-Control", "no-store");
      res.json({ items });
    } catch (error) { await sendError(res, error); }
  });

  app.post("/api/product-ratings", async (req, res) => {
    const wait = limited(orderAttempts, req.ip || "unknown", 20, 10 * 60 * 1000);
    if (wait) return res.status(429).json({ ok: false, message: "محاولات كثيرة. حاول بعد قليل." });
    try {
      const result = await submitProductRating({
        orderNumber: Number(req.body?.orderNumber),
        phone: cleanText(req.body?.phone, 30),
        productId: cleanText(req.body?.productId, 32),
        rating: Number(req.body?.rating),
      });
      res.status(201).json({ ok: true, rating: result });
    } catch (error) { await sendError(res, error); }
  });

  app.post("/api/admin/menu-images", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false, message: "هذا الإجراء للإدارة فقط" });
    const updates = req.body?.updates;
    if (!Array.isArray(updates) || updates.length < 1 || updates.length > 5) return res.status(400).json({ ok: false, message: "ارفع الصور على دفعات صغيرة" });
    if (updates.some((item) => !Number.isInteger(Number(item?.id)) || typeof item?.image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(item.image) || item.image.length > 650_000)) {
      return res.status(400).json({ ok: false, message: "ملف صورة غير صالح أو حجمه كبير" });
    }
    try {
      const products = await getMenu();
      let updated = 0;
      for (const item of updates) {
        const product = products.find((entry: { id?: number }) => Number(entry.id) === Number(item.id));
        if (!product) continue;
        product.image = item.image;
        updated++;
      }
      await saveMenu(products);
      res.json({ ok: true, updated });
    } catch (error) { await sendError(res, error); }
  });

  app.get("/api/menu", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try { res.json({ products: await getMenu() }); } catch (error) { await sendError(res, error); }
  });

  app.put("/api/menu", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false, message: "هذا الإجراء للإدارة فقط" });
    const products = req.body?.products;
    if (!Array.isArray(products) || products.length > 1000) return res.status(400).json({ ok: false, message: "قائمة الأصناف غير صحيحة" });
    if (products.some((product) => !product || !Number.isInteger(Number(product.id)) || typeof product.name !== "string" || !product.name.trim() || cleanNumber(product.price, 1000) === null)) {
      return res.status(400).json({ ok: false, message: "تأكد من أسماء وأسعار الأصناف" });
    }
    try { await saveMenu(products); res.json({ ok: true }); } catch (error) { await sendError(res, error); }
  });

  app.get("/api/delivery-areas", async (_req, res) => {
    try {
      const { resolved } = await listAreaModel();
      res.json({ areas: resolved.filter((area) => area.available).map((area) => ({ id: area.id, name: area.name, fee: area.deliveryFee, minimumOrder: area.minimumOrder, groupName: area.groupName })) });
    } catch (error) { await sendError(res, error); }
  });

  app.get("/api/admin/delivery", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    try { res.json(await listAreaModel()); } catch (error) { await sendError(res, error); }
  });

  app.post("/api/admin/areas", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    try {
      const id = await saveArea({ name: cleanText(req.body?.name, 120), active: req.body?.active !== false, minimumOrder: req.body?.minimumOrder, deliveryFee: req.body?.deliveryFee });
      res.status(201).json({ ok: true, id });
    } catch (error) { await sendError(res, error); }
  });

  app.put("/api/admin/areas/:id", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    try {
      await saveArea({ id: Number(req.params.id), name: cleanText(req.body?.name, 120), active: req.body?.active !== false, minimumOrder: req.body?.minimumOrder, deliveryFee: req.body?.deliveryFee });
      res.json({ ok: true });
    } catch (error) { await sendError(res, error); }
  });

  app.delete("/api/admin/areas/:id", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    try { await deleteArea(Number(req.params.id)); res.json({ ok: true }); } catch (error) { await sendError(res, error); }
  });

  app.post("/api/admin/groups", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    try {
      const id = await saveGroup({ name: cleanText(req.body?.name, 120), active: req.body?.active !== false, minimumOrder: req.body?.minimumOrder, deliveryFee: req.body?.deliveryFee, areaIds: Array.isArray(req.body?.areaIds) ? req.body.areaIds.map(Number) : [] });
      res.status(201).json({ ok: true, id });
    } catch (error) { await sendError(res, error); }
  });

  app.put("/api/admin/groups/:id", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    try {
      await saveGroup({ id: Number(req.params.id), name: cleanText(req.body?.name, 120), active: req.body?.active !== false, minimumOrder: req.body?.minimumOrder, deliveryFee: req.body?.deliveryFee, areaIds: Array.isArray(req.body?.areaIds) ? req.body.areaIds.map(Number) : [] });
      res.json({ ok: true });
    } catch (error) { await sendError(res, error); }
  });

  app.delete("/api/admin/groups/:id", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    try { await deleteGroup(Number(req.params.id)); res.json({ ok: true }); } catch (error) { await sendError(res, error); }
  });

  const requireAdmin = async (req: express.Request, res: express.Response) => {
    if (await roleOf(req) === "admin") return true;
    res.status(401).json({ ok: false, message: "يجب تسجيل الدخول كمدير" });
    return false;
  };

  app.get("/api/inventory", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try { res.json((await getJsonDocument("inventory")).sort((a: { name?: string }, b: { name?: string }) => String(a.name || "").localeCompare(String(b.name || ""), "ar"))); }
    catch (error) { await sendError(res, error); }
  });
  app.post("/api/inventory", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const name = cleanText(req.body?.name, 100);
    const unit = cleanText(req.body?.unit, 20) || "حبة";
    const quantity = cleanNumber(req.body?.quantity);
    const minQuantity = cleanNumber(req.body?.minQuantity);
    const costPerUnit = cleanNumber(req.body?.costPerUnit);
    if (name.length < 2 || quantity === null || minQuantity === null || costPerUnit === null) return res.status(400).json({ ok: false, message: "بيانات المخزون غير صحيحة" });
    const item = { id: `STK-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`, name, unit, quantity, minQuantity, costPerUnit, updatedAt: new Date().toISOString() };
    try {
      const items = await getJsonDocument("inventory");
      items.push(item);
      await saveJsonDocument("inventory", items);
      res.status(201).json(item);
    } catch (error) { await sendError(res, error); }
  });
  app.put("/api/inventory/:id", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const name = cleanText(req.body?.name, 100);
    const unit = cleanText(req.body?.unit, 20) || "حبة";
    const quantity = cleanNumber(req.body?.quantity);
    const minQuantity = cleanNumber(req.body?.minQuantity);
    const costPerUnit = cleanNumber(req.body?.costPerUnit);
    if (name.length < 2 || quantity === null || minQuantity === null || costPerUnit === null) return res.status(400).json({ ok: false, message: "بيانات المخزون غير صحيحة" });
    try {
      const items = await getJsonDocument("inventory");
      const item = items.find((entry: { id?: string }) => entry.id === req.params.id);
      if (!item) return res.status(404).json({ ok: false });
      Object.assign(item, { name, unit, quantity, minQuantity, costPerUnit, updatedAt: new Date().toISOString() });
      await saveJsonDocument("inventory", items);
      res.json(item);
    } catch (error) { await sendError(res, error); }
  });
  app.patch("/api/inventory/:id/adjust", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const delta = Number(req.body?.delta);
    if (!Number.isFinite(delta) || Math.abs(delta) > 1_000_000) return res.status(400).json({ ok: false, message: "كمية التعديل غير صحيحة" });
    try {
      const items = await getJsonDocument("inventory");
      const item = items.find((entry: { id?: string; quantity: number }) => entry.id === req.params.id);
      if (!item || item.quantity + delta < 0) return res.status(400).json({ ok: false, message: "الصنف غير موجود أو الكمية الناتجة سالبة" });
      item.quantity = Number((item.quantity + delta).toFixed(3));
      item.updatedAt = new Date().toISOString();
      await saveJsonDocument("inventory", items);
      res.json(item);
    } catch (error) { await sendError(res, error); }
  });
  app.delete("/api/inventory/:id", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const items = await getJsonDocument("inventory");
      const next = items.filter((entry: { id?: string }) => entry.id !== req.params.id);
      if (next.length === items.length) return res.status(404).json({ ok: false });
      await saveJsonDocument("inventory", next);
      res.json({ ok: true });
    } catch (error) { await sendError(res, error); }
  });

  app.get("/api/expenses", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try { res.json((await getJsonDocument("expenses")).sort((a: { date?: string }, b: { date?: string }) => String(b.date || "").localeCompare(String(a.date || "")))); }
    catch (error) { await sendError(res, error); }
  });
  app.post("/api/expenses", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const title = cleanText(req.body?.title, 120);
    const category = cleanText(req.body?.category, 60) || "أخرى";
    const amount = cleanNumber(req.body?.amount, 1_000_000);
    const date = cleanText(req.body?.date, 10);
    const notes = cleanText(req.body?.notes, 500);
    if (title.length < 2 || amount === null || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ ok: false, message: "بيانات المصروف غير صحيحة" });
    const expense = { id: `EXP-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`, title, category, amount: Number(amount.toFixed(3)), date, notes, createdAt: new Date().toISOString() };
    try {
      const expenses = await getJsonDocument("expenses");
      expenses.push(expense);
      await saveJsonDocument("expenses", expenses);
      res.status(201).json(expense);
    } catch (error) { await sendError(res, error); }
  });
  app.delete("/api/expenses/:id", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const expenses = await getJsonDocument("expenses");
      const next = expenses.filter((entry: { id?: string }) => entry.id !== req.params.id);
      if (next.length === expenses.length) return res.status(404).json({ ok: false });
      await saveJsonDocument("expenses", next);
      res.json({ ok: true });
    } catch (error) { await sendError(res, error); }
  });

  app.get("/api/management/summary", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const kuwaitDate = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    const from = typeof req.query.from === "string" ? req.query.from : kuwaitDate(new Date(Date.now() - 29 * 86400000));
    const to = typeof req.query.to === "string" ? req.query.to : kuwaitDate(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return res.status(400).json({ ok: false, message: "الفترة الزمنية غير صحيحة" });
    try {
      const orders = (await listOrders()).filter((order) => { const stamp = new Date(order.createdAt); if (Number.isNaN(stamp.getTime())) return false; const date = kuwaitDate(stamp); return date >= from && date <= to; });
      const validOrders = orders.filter((order) => order.status !== "cancelled");
      const expenses = (await getJsonDocument("expenses")).filter((expense: { date: string }) => expense.date >= from && expense.date <= to);
      const inventory = await getJsonDocument("inventory") as { quantity: number; minQuantity: number; costPerUnit: number; name: string }[];
      const revenue = validOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const expenseTotal = expenses.reduce((sum: number, expense: { amount: number }) => sum + Number(expense.amount || 0), 0);
      const daily = new Map<string, { date: string; orders: number; revenue: number }>();
      for (const order of validOrders) { const date = kuwaitDate(new Date(order.createdAt)); const row = daily.get(date) || { date, orders: 0, revenue: 0 }; row.orders += 1; row.revenue += Number(order.total || 0); daily.set(date, row); }
      const products = new Map<string, number>();
      for (const order of validOrders) for (const item of order.items || []) products.set(item.name, (products.get(item.name) || 0) + Number(item.qty || 0));
      const lowStock = inventory.filter((item) => item.quantity <= item.minQuantity);
      res.json({ from, to, orders: validOrders.length, cancelled: orders.length - validOrders.length, revenue: Number(revenue.toFixed(3)), expenses: Number(expenseTotal.toFixed(3)), net: Number((revenue - expenseTotal).toFixed(3)), averageOrder: validOrders.length ? Number((revenue / validOrders.length).toFixed(3)) : 0, inventoryCount: inventory.length, lowStock: lowStock.length, inventoryValue: Number(inventory.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0).toFixed(3)), daily: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)), topProducts: [...products].map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 8), lowStockItems: lowStock });
    } catch (error) { await sendError(res, error); }
  });

  const login = async (req: express.Request, res: express.Response, allowed: Array<"admin" | "cashier">) => {
    const wait = limited(loginAttempts, req.ip || "unknown", 8, 15 * 60 * 1000);
    if (wait) {
      res.setHeader("Retry-After", String(Math.ceil(wait / 1000)));
      return res.status(429).json({ ok: false, message: "محاولات كثيرة. حاول بعد قليل." });
    }
    const received = typeof req.body?.password === "string" ? req.body.password : "";
    const role = ([["admin", process.env.ADMIN_PASSWORD || ""], ["cashier", process.env.CASHIER_PASSWORD || ""]] as const)
      .find(([candidate, password]) => allowed.includes(candidate) && passwordsMatch(password, received))?.[0];
    if (!role) return res.status(401).json({ ok: false, message: "كلمة المرور غير صحيحة" });
    loginAttempts.delete(req.ip || "unknown");
    const token = crypto.randomBytes(32).toString("hex");
    await createStaffSession(role, token);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Set-Cookie", `${cookieName}=${token}; ${cookieOptions()}`);
    return res.json({ ok: true, role });
  };

  app.post("/api/admin/login", (req, res) => { void login(req, res, ["admin"]).catch((error) => sendError(res, error)); });
  app.post("/api/cashier/login", (req, res) => { void login(req, res, ["cashier", "admin"]).catch((error) => sendError(res, error)); });
  app.get("/api/admin/session", async (req, res) => { res.setHeader("Cache-Control", "no-store"); res.json({ ok: await roleOf(req) === "admin", role: await roleOf(req) }); });
  app.get("/api/staff/session", async (req, res) => { const role = await roleOf(req); res.setHeader("Cache-Control", "no-store"); res.json({ ok: Boolean(role), role }); });
  app.post("/api/admin/logout", async (req, res) => {
    const token = readToken(req);
    if (token) await deleteStaffSession(token);
    res.setHeader("Set-Cookie", `${cookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
    res.json({ ok: true });
  });

  app.post("/api/ai/product-image", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(401).json({ ok: false });
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ ok: false, message: "Prompt is required" });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ ok: false, message: "AI image generation is not configured" });
    try {
      const base = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
      const response = await fetch(`${base}/images/generations`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024", quality: "medium", n: 1 }) });
      const body: { error?: { message?: string }; data?: { b64_json?: string; url?: string }[] } = await response.json();
      if (!response.ok) return res.status(response.status).json({ ok: false, message: body?.error?.message || "Image generation failed" });
      const image = body?.data?.[0]?.b64_json ? `data:image/png;base64,${body.data[0].b64_json}` : body?.data?.[0]?.url;
      if (!image) return res.status(502).json({ ok: false, message: "No image returned" });
      return res.json({ ok: true, image });
    } catch { return res.status(502).json({ ok: false, message: "Image generation service unavailable" }); }
  });


  // Matamly Universal Print v1 — outbound HTTPS polling from registered agents.
  app.post("/api/admin/print/devices/pair", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    const name = cleanText(req.body?.name, 120);
    const platform = req.body?.platform;
    if (name.length < 2 || !validPlatform(platform)) return res.status(400).json({ ok: false, message: "اسم الجهاز أو نظام التشغيل غير صحيح" });
    try {
      const paired = await pairPrintDevice({ name, platform, appVersion: cleanText(req.body?.appVersion, 40), capabilities: req.body?.capabilities });
      res.status(201).json({ ok: true, ...paired });
    } catch (error) { await sendError(res, error); }
  });
  app.get("/api/admin/print/devices", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    try { res.setHeader("Cache-Control", "no-store"); res.json({ devices: await listPrintDevices() }); }
    catch (error) { await sendError(res, error); }
  });
  app.post("/api/admin/print/devices/:id/revoke", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    try { await revokePrintDevice(cleanText(req.params.id, 36)); res.json({ ok: true }); }
    catch (error) { await sendError(res, error); }
  });
  app.post("/api/admin/print/printers", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    const connectionType = req.body?.connectionType;
    const deviceId = cleanText(req.body?.deviceId, 36);
    const name = cleanText(req.body?.name, 120);
    if (!deviceId || name.length < 2 || !validConnection(connectionType)) return res.status(400).json({ ok: false, message: "بيانات الطابعة غير صحيحة" });
    try {
      const id = await addPrintPrinter({ deviceId, name, model: cleanText(req.body?.model, 120), connectionType, address: cleanText(req.body?.address, 255), isDefault: req.body?.isDefault === true });
      res.status(201).json({ ok: true, id });
    } catch (error) { await sendError(res, error); }
  });
  app.put("/api/admin/print/printers/:id", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    const connectionType = req.body?.connectionType;
    const name = cleanText(req.body?.name, 120);
    if (name.length < 2 || !validConnection(connectionType)) return res.status(400).json({ ok: false, message: "بيانات الطابعة غير صحيحة" });
    try {
      await updatePrintPrinter(cleanText(req.params.id, 36), {
        name, model: cleanText(req.body?.model, 120), connectionType,
        address: cleanText(req.body?.address, 255), enabled: req.body?.enabled !== false,
        isDefault: req.body?.isDefault === true,
      });
      res.json({ ok: true });
    } catch (error) { await sendError(res, error); }
  });
  app.post("/api/print/v1/devices/heartbeat", async (req, res) => {
    const device = await authenticatePrintDevice(deviceToken(req));
    if (!device) return res.status(401).json({ ok: false });
    try {
      await heartbeatPrintDevice({ id: device.id, appVersion: cleanText(req.body?.appVersion, 40), capabilities: req.body?.capabilities });
      res.json({ ok: true, serverTime: new Date().toISOString() });
    } catch (error) { await sendError(res, error); }
  });
  app.get("/api/print/v1/jobs/claim", async (req, res) => {
    const device = await authenticatePrintDevice(deviceToken(req));
    if (!device) return res.status(401).json({ ok: false });
    try {
      const job = await claimUniversalPrintJob(device.id);
      res.setHeader("Cache-Control", "no-store");
      res.json({ job });
    } catch (error) { await sendError(res, error); }
  });
  app.post("/api/print/v1/jobs/:id/stage", async (req, res) => {
    const device = await authenticatePrintDevice(deviceToken(req));
    if (!device) return res.status(401).json({ ok: false });
    if (!validStage(req.body?.stage) || !["ok", "failed", "uncertain"].includes(req.body?.status)) return res.status(400).json({ ok: false, message: "بيانات حالة الطباعة غير صحيحة" });
    try {
      await recordUniversalPrintStage({ jobId: Number(req.params.id), deviceId: device.id, stage: req.body.stage as PrintStage, status: req.body.status, message: cleanText(req.body?.message, 500) });
      res.json({ ok: true });
    } catch (error) { await sendError(res, error); }
  });
  app.get("/api/admin/print/jobs/:id/events", async (req, res) => {
    if (await roleOf(req) !== "admin") return res.status(403).json({ ok: false });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ ok: false });
    try { res.json({ events: await listPrintJobEvents(id) }); }
    catch (error) { await sendError(res, error); }
  });

  app.get("/api/print-agent/jobs/claim", async (req, res) => {
    if (!agentAuthorized(req)) return res.status(401).json({ ok: false });
    try {
      const worker = cleanText(req.header("x-print-worker") || "local-agent", 80);
      res.json({ job: await claimPrintJob(worker) });
    } catch (error) { await sendError(res, error); }
  });
  app.post("/api/print-agent/jobs/:id/result", async (req, res) => {
    if (!agentAuthorized(req)) return res.status(401).json({ ok: false });
    try {
      await finishPrintJob(Number(req.params.id), req.body?.ok === true, cleanText(req.body?.error, 500));
      res.json({ ok: true });
    } catch (error) { await sendError(res, error); }
  });
  app.post("/api/print-agent/jobs/:id/retry", async (req, res) => {
    if (!agentAuthorized(req)) return res.status(401).json({ ok: false });
    try { await retryPrintJob(Number(req.params.id)); res.json({ ok: true }); }
    catch (error) { await sendError(res, error); }
  });
}
