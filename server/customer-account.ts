import crypto from "node:crypto";
import type express from "express";
import { promisify } from "node:util";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getPool, RestaurantError } from "./restaurant-db";

const scrypt = promisify(crypto.scrypt);
const cookieName = "matamly_customer_session";
const attempts = new Map<string, { count: number; resetAt: number }>();
const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
function readToken(req: express.Request) {
  return req.headers.cookie?.match(new RegExp("(?:^|; )" + cookieName + "=([a-f0-9]{64})"))?.[1] || "";
}
function limited(key: string) {
  const now = Date.now(), old = attempts.get(key);
  if (old && old.resetAt > now && old.count >= 8) return true;
  attempts.set(key, old && old.resetAt > now ? { count: old.count + 1, resetAt: old.resetAt } : { count: 1, resetAt: now + 900000 });
  return false;
}
async function makeHash(password: string) {
  const salt = crypto.randomBytes(16), hash = await scrypt(password, salt, 64) as Buffer;
  return "scrypt:" + salt.toString("hex") + ":" + hash.toString("hex");
}
async function verifyHash(stored: string, password: string) {
  const [kind, salt, hex] = stored.split(":");
  if (kind !== "scrypt" || !salt || !hex) return false;
  const actual = await scrypt(password, Buffer.from(salt, "hex"), 64) as Buffer, expected = Buffer.from(hex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function setSession(res: express.Response, token: string) {
  res.setHeader("Set-Cookie", cookieName + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; " + (process.env.NODE_ENV === "production" ? "Secure; " : "") + "Max-Age=2592000");
}
function fail(res: express.Response, error: unknown) {
  if (error instanceof RestaurantError) return res.status(error.status).json({ ok: false, message: error.message });
  if ((error as { code?: string })?.code === "ER_DUP_ENTRY") return res.status(409).json({ ok: false, message: "البريد الإلكتروني مسجل بالفعل" });
  console.error(error);
  return res.status(500).json({ ok: false, message: "تعذر تنفيذ العملية" });
}
export async function customerAccountId(req: express.Request) {
  const token = readToken(req);
  if (!token) return null;
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT accountId FROM customer_sessions WHERE tokenHash=? AND expiresAt>?", [hashToken(token), new Date()]);
  return rows.length ? Number(rows[0].accountId) : null;
}
export async function getCustomerAccountStats() {
  const db = getPool();
  const [accounts] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM customer_accounts");
  const [active] = await db.query<RowDataPacket[]>("SELECT COUNT(DISTINCT accountId) AS total FROM customer_sessions WHERE expiresAt>?", [new Date()]);
  const [logout] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total, COUNT(DISTINCT accountId) AS customers FROM customer_session_events WHERE eventType='logout'");
  return { registered: Number(accounts[0]?.total || 0), active: Number(active[0]?.total || 0), logoutEvents: Number(logout[0]?.total || 0), customersLoggedOut: Number(logout[0]?.customers || 0) };
}
export function registerCustomerAccountRoutes(app: express.Express) {
  app.post("/api/customer/register", async (req, res) => { try {
    const name = String(req.body?.name || "").trim(), email = String(req.body?.email || "").trim().toLowerCase(), phone = String(req.body?.phone || "").trim(), password = String(req.body?.password || "");
    if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320 || phone.length < 7 || phone.length > 30 || password.length < 8 || password.length > 128) throw new RestaurantError("راجع الاسم والبريد ورقم الهاتف. كلمة المرور 8 أحرف على الأقل.");
    if (limited("register:" + req.ip + ":" + email)) return res.status(429).json({ ok: false, message: "محاولات كثيرة، حاول بعد قليل" });
    const now = new Date(), passwordHash = await makeHash(password);
    const [created] = await getPool().query<ResultSetHeader>("INSERT INTO customer_accounts(name,email,passwordHash,phone,createdAt,updatedAt) VALUES(?,?,?,?,?,?)", [name, email, passwordHash, phone, now, now]);
    const token = crypto.randomBytes(32).toString("hex");
    await getPool().query("INSERT INTO customer_sessions(tokenHash,accountId,expiresAt,createdAt) VALUES(?,?,?,?)", [hashToken(token), created.insertId, new Date(now.getTime() + 2592000000), now]);
    setSession(res, token);
    return res.status(201).json({ ok: true, customer: { id: created.insertId, name, email, phone } });
  } catch (error) { return fail(res, error); } });
  app.post("/api/customer/login", async (req, res) => { try {
    const email = String(req.body?.email || "").trim().toLowerCase(), password = String(req.body?.password || "");
    if (limited("login:" + req.ip + ":" + email)) return res.status(429).json({ ok: false, message: "محاولات كثيرة، حاول بعد قليل" });
    const [rows] = await getPool().query<RowDataPacket[]>("SELECT id,name,email,phone,passwordHash FROM customer_accounts WHERE email=? LIMIT 1", [email]);
    if (!rows.length || !(await verifyHash(String(rows[0].passwordHash), password))) throw new RestaurantError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
    const now = new Date(), token = crypto.randomBytes(32).toString("hex");
    await getPool().query("INSERT INTO customer_sessions(tokenHash,accountId,expiresAt,createdAt) VALUES(?,?,?,?)", [hashToken(token), Number(rows[0].id), new Date(now.getTime() + 2592000000), now]);
    setSession(res, token);
    return res.json({ ok: true, customer: { id: Number(rows[0].id), name: rows[0].name, email: rows[0].email, phone: rows[0].phone } });
  } catch (error) { return fail(res, error); } });
  app.post("/api/customer/logout", async (req, res) => { try {
    const token = readToken(req);
    if (token) {
      const [sessions] = await getPool().query<RowDataPacket[]>("SELECT accountId FROM customer_sessions WHERE tokenHash=?", [hashToken(token)]);
      if (sessions.length) {
        await getPool().query("INSERT INTO customer_session_events(accountId,eventType,createdAt) VALUES(?,'logout',?)", [Number(sessions[0].accountId), new Date()]);
        await getPool().query("DELETE FROM customer_sessions WHERE tokenHash=?", [hashToken(token)]);
      }
    }
    res.setHeader("Set-Cookie", cookieName + "=; Path=/; HttpOnly; SameSite=Lax; " + (process.env.NODE_ENV === "production" ? "Secure; " : "") + "Max-Age=0");
    return res.json({ ok: true });
  } catch (error) { return fail(res, error); } });
  app.get("/api/customer/me", async (req, res) => { try {
    const id = await customerAccountId(req);
    if (!id) return res.status(401).json({ ok: false });
    const [users] = await getPool().query<RowDataPacket[]>("SELECT id,name,email,phone FROM customer_accounts WHERE id=?", [id]);
    const [addresses] = await getPool().query<RowDataPacket[]>("SELECT * FROM customer_addresses WHERE accountId=? ORDER BY isDefault DESC,id DESC", [id]);
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, customer: users[0], addresses });
  } catch (error) { return fail(res, error); } });
  app.put("/api/customer/profile", async (req, res) => { try {
    const id = await customerAccountId(req);
    if (!id) return res.status(401).json({ ok: false });
    const name = String(req.body?.name || "").trim(), phone = String(req.body?.phone || "").trim();
    if (!name || name.length > 100 || phone.length < 7 || phone.length > 30) throw new RestaurantError("الاسم أو رقم الهاتف غير صحيح");
    await getPool().query("UPDATE customer_accounts SET name=?,phone=?,updatedAt=? WHERE id=?", [name, phone, new Date(), id]);
    return res.json({ ok: true, customer: { name, phone } });
  } catch (error) { return fail(res, error); } });
  app.post("/api/customer/addresses", async (req, res) => { try {
    const id = await customerAccountId(req);
    if (!id) return res.status(401).json({ ok: false });
    const b = req.body || {}, label = String(b.label || "").trim().slice(0, 60);
    if (!label) throw new RestaurantError("اكتب اسم العنوان");
    const now = new Date();
    if (b.isDefault) await getPool().query("UPDATE customer_addresses SET isDefault=0 WHERE accountId=?", [id]);
    const [created] = await getPool().query<ResultSetHeader>("INSERT INTO customer_addresses(accountId,label,areaId,areaName,block,street,avenue,floor,apartment,house,isDefault,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", [id, label, b.areaId || null, String(b.areaName || ""), String(b.block || ""), String(b.street || ""), String(b.avenue || ""), String(b.floor || ""), String(b.apartment || ""), String(b.house || ""), b.isDefault ? 1 : 0, now, now]);
    return res.status(201).json({ ok: true, id: created.insertId });
  } catch (error) { return fail(res, error); } });
  app.put("/api/customer/addresses/:id", async (req, res) => { try {
    const id = await customerAccountId(req);
    if (!id) return res.status(401).json({ ok: false });
    const addressId = Number(req.params.id), b = req.body || {}, label = String(b.label || "").trim().slice(0, 60);
    if (!Number.isInteger(addressId) || addressId < 1 || !label) throw new RestaurantError("بيانات العنوان غير صحيحة");
    if (b.isDefault) await getPool().query("UPDATE customer_addresses SET isDefault=0 WHERE accountId=?", [id]);
    const [updated] = await getPool().query<ResultSetHeader>("UPDATE customer_addresses SET label=?,areaId=?,areaName=?,block=?,street=?,avenue=?,floor=?,apartment=?,house=?,isDefault=?,updatedAt=? WHERE id=? AND accountId=?", [label, b.areaId || null, String(b.areaName || ""), String(b.block || ""), String(b.street || ""), String(b.avenue || ""), String(b.floor || ""), String(b.apartment || ""), String(b.house || ""), b.isDefault ? 1 : 0, new Date(), addressId, id]);
    if (!updated.affectedRows) throw new RestaurantError("العنوان غير موجود", 404);
    return res.json({ ok: true });
  } catch (error) { return fail(res, error); } });
  app.delete("/api/customer/addresses/:id", async (req, res) => { try {
    const id = await customerAccountId(req);
    if (!id) return res.status(401).json({ ok: false });
    const [deleted] = await getPool().query<ResultSetHeader>("DELETE FROM customer_addresses WHERE id=? AND accountId=?", [Number(req.params.id), id]);
    if (!deleted.affectedRows) throw new RestaurantError("العنوان غير موجود", 404);
    return res.json({ ok: true });
  } catch (error) { return fail(res, error); } });
  app.get("/api/customer/orders", async (req, res) => { try {
    const id = await customerAccountId(req);
    if (!id) return res.status(401).json({ ok: false });
    const [orders] = await getPool().query<RowDataPacket[]>("SELECT id,orderNumber,createdAt,customerName,customerPhone,serviceMode,areaName,address,notes,payment,foodTotal,deliveryFee,total,status FROM orders WHERE customerAccountId=? ORDER BY createdAt DESC,id DESC LIMIT 100", [id]);
    if (!orders.length) return res.json({ ok: true, orders: [] });
    const ids = orders.map((order) => Number(order.id));
    const [items] = await getPool().query<RowDataPacket[]>("SELECT orderId,productId,name,qty,price,choicesJson FROM order_items WHERE orderId IN (" + ids.map(() => "?").join(",") + ") ORDER BY id", ids);
    return res.json({ ok: true, orders: orders.map((order) => ({ ...order, id: Number(order.id), orderNumber: Number(order.orderNumber), foodTotal: Number(order.foodTotal), deliveryFee: Number(order.deliveryFee), total: Number(order.total), items: items.filter((item) => Number(item.orderId) === Number(order.id)).map((item) => ({ productId: String(item.productId), name: String(item.name), qty: Number(item.qty), price: Number(item.price), choices: JSON.parse(String(item.choicesJson || "[]")) })) })) });
  } catch (error) { return fail(res, error); } });
}