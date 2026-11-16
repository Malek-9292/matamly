import "dotenv/config";
import express from "express";
import { createServer } from "http";
import crypto from "node:crypto";
import { createId, readStore, updateStore } from "../persistence";
import { normalizeOrderItems } from "../order-validation";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const adminSessions = new Set<string>();
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  const orderAttempts = new Map<string, { count: number; resetAt: number }>();
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = `HttpOnly; Path=/; SameSite=Lax; ${isProduction ? "Secure; " : ""}Max-Age=86400`;
  const readAdminToken = (req: express.Request) =>
    req.headers.cookie?.match(/(?:^|; )restaurant_admin_session=([a-f0-9]+)/)?.[1];
  const isAdmin = (req: express.Request) => {
    const token = readAdminToken(req);
    return Boolean(token && adminSessions.has(token));
  };
  const cleanText = (value: unknown, max = 500) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/api/orders", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const attempts = orderAttempts.get(ip);
    if (attempts && attempts.resetAt > now && attempts.count >= 20) {
      res.setHeader("Retry-After", String(Math.ceil((attempts.resetAt - now) / 1000)));
      return res.status(429).json({ ok: false, message: "Too many orders. Try again later." });
    }
    orderAttempts.set(ip, attempts && attempts.resetAt > now
      ? { count: attempts.count + 1, resetAt: attempts.resetAt }
      : { count: 1, resetAt: now + 10 * 60 * 1000 });

    const body = req.body ?? {};
    const customer = body.customer ?? {};
    const submittedItems = body.items;
    if (!Array.isArray(submittedItems) || submittedItems.length < 1 || submittedItems.length > 60) {
      return res.status(400).json({ ok: false, message: "قائمة الأصناف غير صحيحة" });
    }
    const name = cleanText(customer.name, 100);
    const phone = cleanText(customer.phone, 30);
    if (name.length < 2 || !/^[+0-9\s()-]{6,30}$/.test(phone)) {
      return res.status(400).json({ ok: false, message: "يرجى إدخال اسم ورقم هاتف صحيحين" });
    }
    const deliveryFee = Number(body.deliveryFee ?? 0);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || deliveryFee > 100) {
      return res.status(400).json({ ok: false, message: "رسوم التوصيل غير صحيحة" });
    }

    void updateStore(store => {
      if (isProduction && store.menu.length === 0) {
        return { error: "قائمة المطعم غير مفعلة على الخادم. سجّل الدخول إلى لوحة الإدارة واحفظ المنيو أولاً." };
      }
      const normalized = normalizeOrderItems(submittedItems, store.menu, cleanText);
      if (normalized.error) return { error: normalized.error };
      const foodTotal = normalized.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const id = `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
      const order = {
        customer: { name, phone },
        items: normalized.items,
        foodTotal: Number(foodTotal.toFixed(3)),
        deliveryFee: Number(deliveryFee.toFixed(3)),
        total: Number((foodTotal + deliveryFee).toFixed(3)),
        zone: cleanText(body.zone, 100),
        address: cleanText(body.address, 500),
        notes: cleanText(body.notes, 500),
        payment: cleanText(body.payment, 60) || "الدفع عند الاستلام",
        id,
        createdAt: new Date().toISOString(),
        status: "new",
      };
      store.orders.unshift(order);
      return { id, total: order.total, foodTotal: order.foodTotal, items: normalized.items };
    }).then(result => {
      if ("error" in result) return res.status(400).json({ ok: false, message: result.error });
      return res.status(201).json({ ok: true, id: result.id, total: result.total, foodTotal: result.foodTotal, items: result.items });
    }).catch(error => {
      console.error("Order persistence failed", error);
      res.status(500).json({ ok: false, message: "تعذر حفظ الطلب" });
    });
  });
  app.get("/api/orders", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    res.setHeader("Cache-Control", "no-store");
    void readStore().then(store => res.json(store.orders.filter(order => order.status !== "printed").sort((a, b) => b.createdAt.localeCompare(a.createdAt)))).catch(error => { console.error(error); res.status(500).json({ ok: false }); });
  });
  app.patch("/api/orders/:id", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    const status = cleanText(req.body?.status, 20);
    if (!status || !["new", "processing", "printed", "cancelled"].includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid order status" });
    }
    void updateStore(store => {
      const index = store.orders.findIndex(order => order.id === req.params.id);
      if (index < 0) return false;
      store.orders[index] = { ...store.orders[index], status, updatedAt: new Date().toISOString() };
      return true;
    }).then(found => { if (!found) return res.status(404).json({ ok: false }); return res.json({ ok: true }); }).catch(error => { console.error(error); res.status(500).json({ ok: false }); });
  });
  const requireAdmin = (req: express.Request, res: express.Response) => {
    if (isAdmin(req)) return true;
    res.status(401).json({ ok: false, message: "يجب تسجيل الدخول أولاً" });
    return false;
  };
  const cleanNumber = (value: unknown, max = 1_000_000) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
  };

  app.get("/api/settings", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    void readStore().then(store => res.json({ settings: store.settings })).catch(() => res.status(500).json({ ok: false }));
  });
  app.put("/api/settings", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const incoming = req.body?.settings;
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming) || Object.keys(incoming).length > 250) return res.status(400).json({ ok: false, message: "الإعدادات غير صحيحة" });
    const settings: Record<string, string> = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (!key.startsWith("matamly_") || typeof value !== "string" || value.length > 1_500_000) return res.status(400).json({ ok: false, message: "قيمة إعداد غير صالحة" });
      settings[key] = value;
    }
    void updateStore(store => { store.settings = { ...store.settings, ...settings }; }).then(() => res.json({ ok: true })).catch(() => res.status(500).json({ ok: false }));
  });

  app.get("/api/menu", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    void readStore().then(store => res.json({ products: store.menu })).catch(() => res.status(500).json({ ok: false }));
  });
  app.put("/api/menu", (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!Array.isArray(req.body?.products) || req.body.products.length > 1000) return res.status(400).json({ ok: false, message: "قائمة الأصناف غير صحيحة" });
    const products = req.body.products;
    if (products.some((p: any) => !p || !Number.isInteger(Number(p.id)) || typeof p.name !== "string" || !p.name.trim() || cleanNumber(p.price, 1000) === null)) return res.status(400).json({ ok: false, message: "تأكد من أسماء وأسعار الأصناف" });
    void updateStore(store => { store.menu = products; }).then(() => res.json({ ok: true })).catch(() => res.status(500).json({ ok: false }));
  });

  app.get("/api/inventory", (req, res) => {
    if (!requireAdmin(req, res)) return;
    void readStore().then(store => res.json(store.inventory.sort((a, b) => a.name.localeCompare(b.name, "ar")))).catch(() => res.status(500).json({ ok: false }));
  });
  app.post("/api/inventory", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const name = cleanText(req.body?.name, 100);
    const unit = cleanText(req.body?.unit, 20) || "حبة";
    const quantity = cleanNumber(req.body?.quantity);
    const minQuantity = cleanNumber(req.body?.minQuantity);
    const costPerUnit = cleanNumber(req.body?.costPerUnit);
    if (name.length < 2 || quantity === null || minQuantity === null || costPerUnit === null) return res.status(400).json({ ok: false, message: "بيانات المخزون غير صحيحة" });
    const item = { id: createId("STK"), name, unit, quantity, minQuantity, costPerUnit, updatedAt: new Date().toISOString() };
    void updateStore(store => { store.inventory.push(item); }).then(() => res.status(201).json(item)).catch(() => res.status(500).json({ ok: false }));
  });
  app.put("/api/inventory/:id", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const name = cleanText(req.body?.name, 100);
    const unit = cleanText(req.body?.unit, 20) || "حبة";
    const quantity = cleanNumber(req.body?.quantity);
    const minQuantity = cleanNumber(req.body?.minQuantity);
    const costPerUnit = cleanNumber(req.body?.costPerUnit);
    if (name.length < 2 || quantity === null || minQuantity === null || costPerUnit === null) return res.status(400).json({ ok: false, message: "بيانات المخزون غير صحيحة" });
    void updateStore(store => { const item = store.inventory.find(x => x.id === req.params.id); if (!item) return null; Object.assign(item, { name, unit, quantity, minQuantity, costPerUnit, updatedAt: new Date().toISOString() }); return item; }).then(item => item ? res.json(item) : res.status(404).json({ ok: false })).catch(() => res.status(500).json({ ok: false }));
  });
  app.patch("/api/inventory/:id/adjust", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const delta = Number(req.body?.delta);
    if (!Number.isFinite(delta) || Math.abs(delta) > 1_000_000) return res.status(400).json({ ok: false, message: "كمية التعديل غير صحيحة" });
    void updateStore(store => { const item = store.inventory.find(x => x.id === req.params.id); if (!item || item.quantity + delta < 0) return null; item.quantity = Number((item.quantity + delta).toFixed(3)); item.updatedAt = new Date().toISOString(); return item; }).then(item => item ? res.json(item) : res.status(400).json({ ok: false, message: "الصنف غير موجود أو الكمية الناتجة سالبة" })).catch(() => res.status(500).json({ ok: false }));
  });
  app.delete("/api/inventory/:id", (req, res) => {
    if (!requireAdmin(req, res)) return;
    void updateStore(store => { const before = store.inventory.length; store.inventory = store.inventory.filter(x => x.id !== req.params.id); return before !== store.inventory.length; }).then(deleted => deleted ? res.json({ ok: true }) : res.status(404).json({ ok: false })).catch(() => res.status(500).json({ ok: false }));
  });

  app.get("/api/expenses", (req, res) => {
    if (!requireAdmin(req, res)) return;
    void readStore().then(store => res.json(store.expenses.sort((a, b) => b.date.localeCompare(a.date)))).catch(() => res.status(500).json({ ok: false }));
  });
  app.post("/api/expenses", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const title = cleanText(req.body?.title, 120);
    const category = cleanText(req.body?.category, 60) || "أخرى";
    const amount = cleanNumber(req.body?.amount, 1_000_000);
    const date = cleanText(req.body?.date, 10);
    const notes = cleanText(req.body?.notes, 500);
    if (title.length < 2 || amount === null || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ ok: false, message: "بيانات المصروف غير صحيحة" });
    const expense = { id: createId("EXP"), title, category, amount: Number(amount.toFixed(3)), date, notes, createdAt: new Date().toISOString() };
    void updateStore(store => { store.expenses.push(expense); }).then(() => res.status(201).json(expense)).catch(() => res.status(500).json({ ok: false }));
  });
  app.delete("/api/expenses/:id", (req, res) => {
    if (!requireAdmin(req, res)) return;
    void updateStore(store => { const before = store.expenses.length; store.expenses = store.expenses.filter(x => x.id !== req.params.id); return before !== store.expenses.length; }).then(deleted => deleted ? res.json({ ok: true }) : res.status(404).json({ ok: false })).catch(() => res.status(500).json({ ok: false }));
  });
  app.get("/api/management/summary", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const kuwaitDate = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    const from = typeof req.query.from === "string" ? req.query.from : kuwaitDate(new Date(Date.now() - 29 * 86400000));
    const to = typeof req.query.to === "string" ? req.query.to : kuwaitDate(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return res.status(400).json({ ok: false, message: "الفترة الزمنية غير صحيحة" });
    void readStore().then(store => {
      const orders = store.orders.filter(o => { const stamp = new Date(o.createdAt); if (Number.isNaN(stamp.getTime())) return false; const date = kuwaitDate(stamp); return date >= from && date <= to; });
      const validOrders = orders.filter(o => o.status !== "cancelled");
      const expenses = store.expenses.filter(e => e.date >= from && e.date <= to);
      const revenue = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const daily = new Map<string, { date: string; orders: number; revenue: number }>();
      for (const order of validOrders) { const date = kuwaitDate(new Date(order.createdAt)); const row = daily.get(date) || { date, orders: 0, revenue: 0 }; row.orders++; row.revenue += Number(order.total || 0); daily.set(date, row); }
      const products = new Map<string, number>();
      for (const order of validOrders) for (const item of order.items || []) products.set(item.name, (products.get(item.name) || 0) + Number(item.qty || 0));
      const topProducts = [...products].map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 8);
      const lowStock = store.inventory.filter(i => i.quantity <= i.minQuantity);
      return res.json({ from, to, orders: validOrders.length, cancelled: orders.length - validOrders.length, revenue: Number(revenue.toFixed(3)), expenses: Number(expenseTotal.toFixed(3)), net: Number((revenue - expenseTotal).toFixed(3)), averageOrder: validOrders.length ? Number((revenue / validOrders.length).toFixed(3)) : 0, inventoryCount: store.inventory.length, lowStock: lowStock.length, inventoryValue: Number(store.inventory.reduce((sum, i) => sum + i.quantity * i.costPerUnit, 0).toFixed(3)), daily: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)), topProducts, lowStockItems: lowStock });
    }).catch(() => res.status(500).json({ ok: false }));
  });

  app.post("/api/admin/login", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const attempts = loginAttempts.get(ip);
    if (attempts && attempts.resetAt > now && attempts.count >= 8) {
      res.setHeader("Retry-After", String(Math.ceil((attempts.resetAt - now) / 1000)));
      return res.status(429).json({ ok: false, message: "Too many login attempts. Try again later." });
    }
    const expected = process.env.ADMIN_PASSWORD || "";
    const received = typeof req.body?.password === "string" ? req.body.password : "";
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    const valid = expectedBuffer.length > 0 && expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    if (!valid) {
      const current = loginAttempts.get(ip);
      loginAttempts.set(ip, current && current.resetAt > now
        ? { count: current.count + 1, resetAt: current.resetAt }
        : { count: 1, resetAt: now + 15 * 60 * 1000 });
      return res.status(401).json({ ok: false });
    }
    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString("hex");
    adminSessions.add(token);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Set-Cookie", `restaurant_admin_session=${token}; ${cookieOptions}`);
    return res.json({ ok: true });
  });
  app.post("/api/ai/product-image", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ ok: false, message: "Prompt is required" });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ ok: false, message: "AI image generation is not configured" });
    try {
      const base = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
      const r = await fetch(`${base}/images/generations`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024", quality: "medium", n: 1 }) });
      const body: any = await r.json();
      if (!r.ok) return res.status(r.status).json({ ok: false, message: body?.error?.message || "Image generation failed" });
      const image = body?.data?.[0]?.b64_json ? `data:image/png;base64,${body.data[0].b64_json}` : body?.data?.[0]?.url;
      if (!image) return res.status(502).json({ ok: false, message: "No image returned" });
      return res.json({ ok: true, image });
    } catch { return res.status(502).json({ ok: false, message: "Image generation service unavailable" }); }
  });
  app.get("/api/admin/session", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: isAdmin(req) });
  });
  app.post("/api/admin/logout", (req, res) => {
    const token = readAdminToken(req);
    if (token) adminSessions.delete(token);
    res.setHeader("Set-Cookie", `restaurant_admin_session=; HttpOnly; Path=/; SameSite=Lax; ${isProduction ? "Secure; " : ""}Max-Age=0`);
    res.json({ ok: true });
  });
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
