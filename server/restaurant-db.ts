import { readFile } from "node:fs/promises";
import path from "node:path";
import { access } from "node:fs/promises";
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { getMysql2DatabaseUri } from "./database-url";
import { pickSharedSettings } from "../shared/settings";
import { findAreaConflicts, money, resolveAreas, type AreaRule, type GroupRule } from "./delivery-rules";
import { prepareOrder } from "./order-rules";
import { readStore, type MatamlyStore } from "./persistence";
import { buildReceipt } from "./receipt";
import { sha256, createDeviceCredential, type PrintPlatform, type PrintConnection, type PrintStage } from "./print-core/protocol";

export class RestaurantError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

let pool: Pool | null = null;

/**
 * Run one direct MySQL connection attempt to expose the underlying handshake
 * error (the pool can otherwise surface only PROTOCOL_CONNECTION_LOST).
 * Never log the connection URI or credentials.
 */
export async function diagnoseDatabaseConnection() {
  const uri = getMysql2DatabaseUri();
  let connection: Awaited<ReturnType<typeof mysql.createConnection>> | undefined;
  try {
    connection = await mysql.createConnection({
      uri,
      ssl: {},
      connectTimeout: 15_000,
      charset: "utf8mb4",
      timezone: "Z",
    });
    await connection.query("SELECT 1");
    console.info("[DB diagnostic] Direct MySQL connection and TLS handshake succeeded");
    return { ok: true as const };
  } catch (error) {
    const details = error as NodeJS.ErrnoException & { fatal?: boolean };
    console.error("[DB diagnostic] Direct connection failed", {
      code: details.code || "UNKNOWN",
      message: details.message || "No error message",
      syscall: details.syscall,
      fatal: details.fatal,
    });
    return { ok: false as const, code: details.code || "UNKNOWN" };
  } finally {
    if (connection) {
      try { await connection.end(); } catch { /* diagnostic cleanup */ }
    }
  }
}

export function getPool() {
  if (pool) return pool;
  const uri = getMysql2DatabaseUri();

  // Remove the unsupported ssl-mode URI parameter and enable TLS explicitly.
  const options = {
    uri,
    ssl: {},
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 4 * 60 * 1000,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 30 * 1000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: "utf8mb4",
    timezone: "Z",
  };

  const created = mysql.createPool(options);

  // Enzonic's free MySQL compute can sleep after inactivity and close idle
  // sockets. mysql2 removes a failed socket, but callers may keep reusing this
  // pool instance. Invalidate the whole pool on fatal connection errors so the
  // next request creates a fresh TLS connection.
  const invalidateIfCurrent = (error: unknown) => {
    const details = error as { fatal?: boolean; code?: string } | null;
    if (!details || (!details.fatal && ![
      "PROTOCOL_CONNECTION_LOST",
      "ECONNRESET",
      "EPIPE",
      "ETIMEDOUT",
      "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
    ].includes(String(details.code || "")))) return;
    if (pool === created) {
      pool = null;
      console.warn("[Database] Invalidated stale MySQL pool after a fatal connection error");
    }
  };

  created.on("connection", (connection) => {
    connection.on("error", invalidateIfCurrent);
  });
  created.on("error", invalidateIfCurrent);

  pool = created;
  return created;
}

export async function resetPool() {
  const previous = pool;
  pool = null;
  if (previous) {
    try { await previous.end(); }
    catch (error) { console.warn("[Database] Previous pool shutdown failed:", error); }
  }
}

export function setPoolForTests(next: Pool | null) {
  pool = next;
}

function rows<T extends RowDataPacket>(value: unknown) {
  return value as T[];
}

async function applySqlFile(db: Pool, fileName: string) {
  const sql = await readFile(path.join(process.cwd(), "drizzle", fileName), "utf8");
  const statements = sql.split(/;\s*(?:\r?\n|$)/).map((part) => part.trim()).filter((part) => part && !part.startsWith("--"));
  for (const statement of statements) await db.query(statement);
}

async function applied(db: Pool, id: string) {
  const [found] = await db.query<RowDataPacket[]>("SELECT id FROM schema_migrations WHERE id = ?", [id]);
  return found.length > 0;
}

export async function migrate(db = getPool()) {
  const [current] = await db.query<RowDataPacket[]>("SELECT DATABASE() AS name");
  const databaseName = String(current[0]?.name || "").replace(/`/g, "");
  if (databaseName) await db.query(`ALTER DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await db.query("CREATE TABLE IF NOT EXISTS schema_migrations (id varchar(64) PRIMARY KEY, appliedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  if (!(await applied(db, "0000_initial_users"))) {
    await applySqlFile(db, "0000_initial_users.sql");
    await db.query("INSERT INTO schema_migrations (id) VALUES ('0000_initial_users')");
  }
  if (!(await applied(db, "0001_restaurant"))) {
    await applySqlFile(db, "0001_restaurant.sql");
    await db.query("INSERT INTO schema_migrations (id) VALUES ('0001_restaurant')");
  }
  if (!(await applied(db, "0002_product_ratings"))) {
    await applySqlFile(db, "0002_product_ratings.sql");
    await db.query("INSERT INTO schema_migrations (id) VALUES ('0002_product_ratings')");
  }
  if (!(await applied(db, "0003_customer_accounts"))) {
    await applySqlFile(db, "0003_customer_accounts.sql");
    await db.query("INSERT INTO schema_migrations (id) VALUES ('0003_customer_accounts')");
  }
  if (!(await applied(db, "0004_universal_print"))) {
    await applySqlFile(db, "0004_universal_print.sql");
    await db.query("INSERT INTO schema_migrations (id) VALUES ('0004_universal_print')");
  }
  for (const table of ["users", "schema_migrations", "app_settings", "documents", "delivery_areas", "delivery_groups", "delivery_group_areas", "order_counters", "orders", "order_items", "print_jobs", "print_devices", "print_printers", "print_job_events", "staff_sessions", "customer_accounts", "customer_sessions", "customer_session_events", "customer_addresses"]) {
    await db.query(`ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  }
}

async function document(db: Pool, name: string) {
  const [found] = await db.query<RowDataPacket[]>("SELECT body FROM documents WHERE name = ?", [name]);
  return found[0]?.body ? String(found[0].body) : "";
}

async function saveDocument(db: Pool, name: string, body: unknown) {
  const json = typeof body === "string" ? body : JSON.stringify(body);
  await db.query("INSERT INTO documents (name, body) VALUES (?, ?) ON DUPLICATE KEY UPDATE body = VALUES(body)", [name, json]);
}

async function areaCount(db: Pool) {
  const [found] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM delivery_areas");
  return Number(found[0]?.total || 0);
}

async function insertAreas(db: Pool, areas: { name: string; fee: number; minimumOrder: number }[]) {
  const now = new Date();
  for (const area of areas) {
    if (!area.name) continue;
    await db.query(
      "INSERT IGNORE INTO delivery_areas (name, active, minimumOrder, deliveryFee, createdAt, updatedAt) VALUES (?, 1, ?, ?, ?, ?)",
      [area.name, money(area.minimumOrder).toFixed(3), money(area.fee).toFixed(3), now, now],
    );
  }
}

async function ensureDefaults(db: Pool) {
  const defaults: Record<string, string> = {
    matamly_name: "فتوش الخالدية",
    matamly_banner_name: "فتوش الخالدية",
    matamly_banner_slogan: "",
    matamly_banner_size: "52",
    matamly_banner_color_1: "#F4E2B0",
    matamly_banner_color_2: "#E7B15A",
    matamly_banner_color_3: "#F7F1E4",
    matamly_banner_bg: "#123C2F",
    matamly_banner_align: "center",
    matamly_banner_visible: "1",
    matamly_banner_preset: "heritage",
    matamly_logo_size: "84",
    matamly_logo_position: "start",
    matamly_footer_text: "جميع الحقوق محفوظة - إنشاء م/ محمد فتحي",
    matamly_footer_text_size: "11",
    matamly_footer_text_color: "#6f7d74",
    matamly_footer_align: "center",
    matamly_footer_visible: "1",
    matamly_footer_color: "#0B2B22",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db.query("INSERT IGNORE INTO app_settings (`key`, value) VALUES (?, ?)", [key, value]);
  }
  const [revision] = await db.query<RowDataPacket[]>("SELECT value FROM app_settings WHERE `key` = '__revision'");
  if (!revision.length) await db.query("INSERT INTO app_settings (`key`, value) VALUES ('__revision', '0')");
}

async function importLegacy(db: Pool, store: MatamlyStore) {
  if (store.menu.length) await saveDocument(db, "menu", store.menu);
  if (store.inventory.length) await saveDocument(db, "inventory", store.inventory);
  if (store.expenses.length) await saveDocument(db, "expenses", store.expenses);
  const settings = pickSharedSettings(store.settings || {});
  for (const [key, value] of Object.entries(settings)) {
    await db.query("INSERT INTO app_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [key, value]);
  }
  const minimum = Number(store.settings?.matamly_min_order || 3);
  let zones: { name: string; fee: number }[] = [];
  try { zones = JSON.parse(store.settings?.matamly_zones || "[]"); } catch { zones = []; }
  if (Array.isArray(zones) && zones.length && (await areaCount(db)) === 0) {
    await insertAreas(db, zones.filter((zone) => zone && zone.name).map((zone) => ({ name: String(zone.name), fee: Number(zone.fee) || 0, minimumOrder: Number.isFinite(minimum) ? minimum : 0 })));
  }
  const orders = [...store.orders].filter((order) => order && order.id).sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  for (const legacy of orders) {
    const legacyId = String(legacy.id);
    const [existing] = await db.query<RowDataPacket[]>("SELECT id FROM orders WHERE legacyId = ?", [legacyId]);
    if (existing.length) continue;
    const modeText = String(legacy.serviceMode || "");
    const serviceMode = modeText.includes("استلام") || legacy.address === "استلام من المطعم" ? "pickup" : "delivery";
    const status = legacy.status === "printed" ? "completed" : ["new", "processing", "ready", "completed", "cancelled"].includes(legacy.status) ? legacy.status : "new";
    const createdAt = new Date(legacy.createdAt || Date.now());
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [counter] = await conn.query<RowDataPacket[]>("SELECT nextNumber FROM order_counters WHERE id = 1 FOR UPDATE");
      const orderNumber = Number(counter[0]?.nextNumber || 1);
      await conn.query("UPDATE order_counters SET nextNumber = ? WHERE id = 1", [orderNumber + 1]);
      const [inserted] = await conn.query<ResultSetHeader>(
        `INSERT INTO orders (orderNumber, legacyId, customerName, customerPhone, serviceMode, areaName, address, notes, payment, foodTotal, deliveryFee, minimumOrder, minimumMet, total, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?)`,
        [orderNumber, legacyId, String(legacy.customer?.name || ""), String(legacy.customer?.phone || ""), serviceMode, String(legacy.zone || ""), String(legacy.address || ""), String(legacy.notes || ""), String(legacy.payment || ""), Number(legacy.foodTotal || 0).toFixed(3), Number(legacy.deliveryFee || 0).toFixed(3), Number(legacy.total || 0).toFixed(3), status, createdAt, createdAt],
      );
      for (const item of legacy.items || []) {
        await conn.query("INSERT INTO order_items (orderId, productId, name, qty, price, choicesJson) VALUES (?, ?, ?, ?, ?, ?)", [inserted.insertId, String(item.productId || item.id || ""), String(item.name || ""), Number(item.qty || 1), Number(item.price || 0).toFixed(3), JSON.stringify(item.choices || [])]);
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally { conn.release(); }
  }
}

export async function initRestaurant() {
  const db = getPool();
  // Render may briefly run the old and new web instances together during a
  // rolling deploy. Serialize schema migration and legacy seeding across them.
  // MySQL advisory locks are connection-scoped, so keep this connection open
  // until the complete initialization sequence has finished.
  const lockConnection = await db.getConnection();
  let lockAcquired = false;
  try {
    const [lockRows] = await lockConnection.query<RowDataPacket[]>(
      "SELECT GET_LOCK(?, 120) AS acquired",
      ["matamly_restaurant_initialization"],
    );
    lockAcquired = Number(lockRows[0]?.acquired) === 1;
    if (!lockAcquired) {
      throw new Error("Timed out waiting for the restaurant database initialization lock");
    }

    await migrate(db);
    if (await document(db, "import_complete")) return;
    const dataFile = process.env.MATAMLY_DATA_FILE || path.join(process.cwd(), "data", "matamly.json");
    let legacy: MatamlyStore | null = null;
    try {
      await access(dataFile);
      legacy = await readStore();
    } catch { legacy = null; }
    if (legacy) await importLegacy(db, legacy);
    if (!(await document(db, "menu"))) {
      const seed = JSON.parse(await readFile(path.join(process.cwd(), "server", "seed", "default-menu.json"), "utf8"));
      await saveDocument(db, "menu", seed);
    }
    if ((await areaCount(db)) === 0) {
      const zones = JSON.parse(await readFile(path.join(process.cwd(), "server", "seed", "default-zones.json"), "utf8")) as { name: string; fee: number }[];
      await insertAreas(db, zones.map((zone) => ({ name: zone.name, fee: Number(zone.fee) || 0, minimumOrder: 3 })));
    }
    await ensureDefaults(db);
    await saveDocument(db, "import_complete", "1");
  } finally {
    if (lockAcquired) {
      try {
        await lockConnection.query("SELECT RELEASE_LOCK(?)", ["matamly_restaurant_initialization"]);
      } catch (error) {
        console.warn("[Database] Could not release initialization lock cleanly:", error);
      }
    }
    lockConnection.release();
  }
}

export async function getMenu() {
  const body = await document(getPool(), "menu");
  if (!body) return [];
  const parsed = JSON.parse(body);
  return Array.isArray(parsed) ? parsed : [];
}

export async function saveMenu(products: unknown[]) {
  await saveDocument(getPool(), "menu", products);
}

export async function getJsonDocument(name: string) {
  const body = await document(getPool(), name);
  if (!body) return [];
  const parsed = JSON.parse(body);
  return Array.isArray(parsed) ? parsed : [];
}

export async function saveJsonDocument(name: string, value: unknown[]) {
  await saveDocument(getPool(), name, value);
}

export async function getSettings() {
  const [found] = await getPool().query<RowDataPacket[]>("SELECT `key`, value FROM app_settings");
  const settings: Record<string, string> = {};
  let revision = 0;
  for (const row of found) {
    if (row.key === "__revision") revision = Number(row.value) || 0;
    else settings[String(row.key)] = String(row.value);
  }
  return { settings: pickSharedSettings(settings), revision };
}

export async function saveSettings(incoming: Record<string, string>, revision: number) {
  const settings = pickSharedSettings(incoming);
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [currentRow] = await conn.query<RowDataPacket[]>("SELECT value FROM app_settings WHERE `key` = '__revision' FOR UPDATE");
    const current = currentRow.length ? Number(currentRow[0].value) || 0 : 0;
    if (current !== revision) {
      await conn.rollback();
      return { conflict: true, revision: current };
    }
    for (const [key, value] of Object.entries(settings)) {
      await conn.query("INSERT INTO app_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [key, value]);
    }
    const next = current + 1;
    await conn.query("INSERT INTO app_settings (`key`, value) VALUES ('__revision', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [String(next)]);
    await conn.commit();
    return { conflict: false, revision: next };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally { conn.release(); }
}

function mapArea(row: RowDataPacket): AreaRule {
  return { id: Number(row.id), name: String(row.name), active: Number(row.active) === 1, minimumOrder: Number(row.minimumOrder), deliveryFee: Number(row.deliveryFee) };
}

export async function listAreaModel() {
  const db = getPool();
  const [areaRows] = await db.query<RowDataPacket[]>("SELECT * FROM delivery_areas ORDER BY name");
  const [groupRows] = await db.query<RowDataPacket[]>("SELECT * FROM delivery_groups ORDER BY name");
  const [links] = await db.query<RowDataPacket[]>("SELECT areaId, groupId FROM delivery_group_areas");
  const areas = areaRows.map(mapArea);
  const groups: GroupRule[] = groupRows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    active: Number(row.active) === 1,
    minimumOrder: Number(row.minimumOrder),
    deliveryFee: Number(row.deliveryFee),
    areaIds: links.filter((link) => Number(link.groupId) === Number(row.id)).map((link) => Number(link.areaId)),
  }));
  return { areas, groups, resolved: resolveAreas(areas, groups) };
}

function assertMoney(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1000) throw new RestaurantError(`${label} غير صحيح`);
  return money(number);
}

export async function saveArea(input: { id?: number; name: string; active: boolean; minimumOrder: unknown; deliveryFee: unknown }) {
  const name = input.name.trim().slice(0, 120);
  if (name.length < 2) throw new RestaurantError("اسم المنطقة غير صحيح");
  const minimumOrder = assertMoney(input.minimumOrder, "الحد الأدنى");
  const deliveryFee = assertMoney(input.deliveryFee, "رسوم التوصيل");
  const now = new Date();
  const db = getPool();
  try {
    if (input.id) {
      const [result] = await db.query<ResultSetHeader>("UPDATE delivery_areas SET name = ?, active = ?, minimumOrder = ?, deliveryFee = ?, updatedAt = ? WHERE id = ?", [name, input.active ? 1 : 0, minimumOrder.toFixed(3), deliveryFee.toFixed(3), now, input.id]);
      if (!result.affectedRows) throw new RestaurantError("المنطقة غير موجودة", 404);
      return input.id;
    }
    const [result] = await db.query<ResultSetHeader>("INSERT INTO delivery_areas (name, active, minimumOrder, deliveryFee, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)", [name, input.active ? 1 : 0, minimumOrder.toFixed(3), deliveryFee.toFixed(3), now, now]);
    return result.insertId;
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new RestaurantError("اسم المنطقة مستخدم بالفعل");
    throw error;
  }
}

export async function deleteArea(id: number) {
  const [result] = await getPool().query<ResultSetHeader>("DELETE FROM delivery_areas WHERE id = ?", [id]);
  if (!result.affectedRows) throw new RestaurantError("المنطقة غير موجودة", 404);
}

export async function saveGroup(input: { id?: number; name: string; active: boolean; minimumOrder: unknown; deliveryFee: unknown; areaIds: number[] }) {
  const name = input.name.trim().slice(0, 120);
  if (name.length < 2) throw new RestaurantError("اسم المجموعة غير صحيح");
  const areaIds = [...new Set(input.areaIds.map(Number))].filter((id) => Number.isInteger(id) && id > 0);
  const minimumOrder = assertMoney(input.minimumOrder, "الحد الأدنى");
  const deliveryFee = assertMoney(input.deliveryFee, "رسوم التوصيل");
  const now = new Date();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    let groupId = input.id || 0;
    if (groupId) {
      const [updated] = await conn.query<ResultSetHeader>("UPDATE delivery_groups SET name = ?, active = ?, minimumOrder = ?, deliveryFee = ?, updatedAt = ? WHERE id = ?", [name, input.active ? 1 : 0, minimumOrder.toFixed(3), deliveryFee.toFixed(3), now, groupId]);
      if (!updated.affectedRows) throw new RestaurantError("المجموعة غير موجودة", 404);
    } else {
      const [inserted] = await conn.query<ResultSetHeader>("INSERT INTO delivery_groups (name, active, minimumOrder, deliveryFee, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)", [name, input.active ? 1 : 0, minimumOrder.toFixed(3), deliveryFee.toFixed(3), now, now]);
      groupId = inserted.insertId;
    }
    if (areaIds.length) {
      const [known] = await conn.query<RowDataPacket[]>(`SELECT id FROM delivery_areas WHERE id IN (${areaIds.map(() => "?").join(",")})`, areaIds);
      if (known.length !== areaIds.length) throw new RestaurantError("إحدى المناطق المحددة غير موجودة");
      const [memberships] = await conn.query<RowDataPacket[]>("SELECT areaId, groupId FROM delivery_group_areas");
      const conflicts = findAreaConflicts(areaIds, memberships.map((row) => ({ areaId: Number(row.areaId), groupId: Number(row.groupId) })), groupId);
      if (conflicts.length) throw new RestaurantError("لا يمكن إضافة منطقة مرتبطة بمجموعة أخرى");
    }
    await conn.query("DELETE FROM delivery_group_areas WHERE groupId = ?", [groupId]);
    for (const areaId of areaIds) await conn.query("INSERT INTO delivery_group_areas (areaId, groupId) VALUES (?, ?)", [areaId, groupId]);
    await conn.commit();
    return groupId;
  } catch (error) {
    await conn.rollback();
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new RestaurantError("اسم المجموعة مستخدم بالفعل أو المنطقة مرتبطة بمجموعة أخرى");
    throw error;
  } finally { conn.release(); }
}

export async function deleteGroup(id: number) {
  const [result] = await getPool().query<ResultSetHeader>("DELETE FROM delivery_groups WHERE id = ?", [id]);
  if (!result.affectedRows) throw new RestaurantError("المجموعة غير موجودة", 404);
}

export type PublicOrder = {
  id: number;
  orderNumber: number;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; phone: string };
  items: { name: string; category?: string; description?: string; qty: number; price: number; choices: string[] }[];
  foodTotal: number;
  deliveryFee: number;
  minimumOrder: number;
  minimumMet: boolean;
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

function mapOrder(row: RowDataPacket, items: RowDataPacket[], job?: RowDataPacket): PublicOrder {
  return {
    id: Number(row.id),
    orderNumber: Number(row.orderNumber),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    customer: { name: String(row.customerName), phone: String(row.customerPhone) },
    items: items.map((item) => {
      const saved = JSON.parse(String(item.choicesJson || "[]"));
      return { name: String(item.name), category: Array.isArray(saved) ? "" : String(saved?.category || ""), description: Array.isArray(saved) ? "" : String(saved?.description || ""), qty: Number(item.qty), price: Number(item.price), choices: Array.isArray(saved) ? saved : Array.isArray(saved?.choices) ? saved.choices : [] };
    }),
    foodTotal: Number(row.foodTotal),
    deliveryFee: Number(row.deliveryFee),
    minimumOrder: Number(row.minimumOrder),
    minimumMet: Number(row.minimumMet) === 1,
    total: Number(row.total),
    zone: String(row.areaName || ""),
    address: String(row.address || ""),
    notes: String(row.notes || ""),
    payment: String(row.payment || ""),
    serviceMode: row.serviceMode,
    status: row.status,
    printStatus: job ? job.status : "none",
    printError: job ? String(job.lastError || "") : "",
  };
}

async function loadOrder(db: Pool, id: number) {
  const [orderRows] = await db.query<RowDataPacket[]>("SELECT * FROM orders WHERE id = ?", [id]);
  if (!orderRows.length) return null;
  const [itemRows] = await db.query<RowDataPacket[]>("SELECT * FROM order_items WHERE orderId = ? ORDER BY id", [id]);
  const [jobs] = await db.query<RowDataPacket[]>("SELECT * FROM print_jobs WHERE orderId = ? ORDER BY id DESC LIMIT 1", [id]);
  return mapOrder(orderRows[0], itemRows, jobs[0]);
}

export async function listOrders() {
  const db = getPool();
  const [orderRows] = await db.query<RowDataPacket[]>("SELECT * FROM orders ORDER BY createdAt DESC, id DESC");
  if (!orderRows.length) return [];
  const ids = orderRows.map((row) => Number(row.id));
  const [itemRows] = await db.query<RowDataPacket[]>(`SELECT * FROM order_items WHERE orderId IN (${ids.map(() => "?").join(",")}) ORDER BY id`, ids);
  const [jobs] = await db.query<RowDataPacket[]>(`SELECT * FROM print_jobs WHERE id IN (SELECT MAX(id) FROM print_jobs WHERE orderId IN (${ids.map(() => "?").join(",")}) GROUP BY orderId)`, ids);
  const jobByOrder = new Map(jobs.map((job) => [Number(job.orderId), job]));
  return orderRows.map((row) => mapOrder(row, itemRows.filter((item) => Number(item.orderId) === Number(row.id)), jobByOrder.get(Number(row.id))));
}

export async function createCustomerOrder(body: Record<string, unknown>) {
  const db = getPool();
  const menu = await getMenu();
  const { areas, groups } = await listAreaModel();
  const prepared = prepareOrder(body, menu, areas, groups);
  if (!prepared.ok) throw new RestaurantError(prepared.error);
  const requestId = typeof body.clientRequestId === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(body.clientRequestId) ? body.clientRequestId : null;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [counter] = await conn.query<RowDataPacket[]>("SELECT nextNumber FROM order_counters WHERE id = 1 FOR UPDATE");
      if (!counter.length) throw new RestaurantError("عداد الطلبات غير مهيأ", 500);
      if (requestId) {
        const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM orders WHERE clientRequestId = ? FOR UPDATE", [requestId]);
        if (existing.length) {
          await conn.commit();
          const order = await loadOrder(db, Number(existing[0].id));
          if (!order) throw new RestaurantError("تعذر قراءة الطلب المحفوظ", 500);
          return order;
        }
      }
      const orderNumber = Number(counter[0].nextNumber);
      await conn.query("UPDATE order_counters SET nextNumber = ? WHERE id = 1", [orderNumber + 1]);
      const now = new Date();
      const order = prepared.order;
      const [inserted] = await conn.query<ResultSetHeader>(
        `INSERT INTO orders (orderNumber, clientRequestId, customerAccountId, customerName, customerPhone, serviceMode, areaId, areaName, address, notes, payment, foodTotal, deliveryFee, minimumOrder, minimumMet, total, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'new', ?, ?)`,
        [orderNumber, requestId, body.customerAccountId || null, order.customerName, order.customerPhone, order.serviceMode, order.areaId, order.areaName, order.address, order.notes, order.payment, order.foodTotal.toFixed(3), order.deliveryFee.toFixed(3), order.minimumOrder.toFixed(3), order.total.toFixed(3), now, now],
      );
      for (const item of order.items) {
        await conn.query("INSERT INTO order_items (orderId, productId, name, qty, price, choicesJson) VALUES (?, ?, ?, ?, ?, ?)", [inserted.insertId, String(item.productId), item.name, item.qty, item.price.toFixed(3), JSON.stringify({ choices: item.choices, category: String((item as typeof item & { category?: string }).category || ""), description: String((item as typeof item & { description?: string }).description || "") })]);
      }
      const [printTargets] = await conn.query<RowDataPacket[]>("SELECT p.deviceId, p.id AS printerId FROM print_printers p JOIN print_devices d ON d.id = p.deviceId WHERE d.status = 'online' AND p.enabled = 1 AND p.isDefault = 1 ORDER BY d.lastSeenAt DESC LIMIT 1");
      const target = printTargets[0];
      await conn.query("INSERT INTO print_jobs (orderId, kind, status, idempotencyKey, deviceId, printerId, createdAt, updatedAt) VALUES (?, 'auto', 'pending', ?, ?, ?, ?, ?)", [inserted.insertId, "order-" + inserted.insertId + "-auto", target?.deviceId || null, target?.printerId || null, now, now]);
      await conn.commit();
      const saved = await loadOrder(db, inserted.insertId);
      if (!saved) throw new RestaurantError("تعذر قراءة الطلب بعد حفظه", 500);
      return saved;
    } catch (error) {
      await conn.rollback();
      const code = (error as { code?: string }).code;
      lastError = error;
      if (code !== "ER_LOCK_DEADLOCK" && code !== "ER_LOCK_WAIT_TIMEOUT") throw error;
    } finally { conn.release(); }
  }
  throw lastError;
}

const statuses = new Set(["new", "processing", "ready", "completed", "cancelled"]);

export async function updateOrderStatus(id: number, status: string) {
  if (!statuses.has(status)) throw new RestaurantError("حالة الطلب غير صحيحة");
  const [result] = await getPool().query<ResultSetHeader>("UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?", [status, new Date(), id]);
  if (!result.affectedRows) throw new RestaurantError("الطلب غير موجود", 404);
  return loadOrder(getPool(), id);
}

export async function reprintOrder(id: number) {
  const db = getPool();
  const order = await loadOrder(db, id);
  if (!order) throw new RestaurantError("الطلب غير موجود", 404);
  const [open] = await db.query<RowDataPacket[]>("SELECT id FROM print_jobs WHERE orderId = ? AND status IN ('pending', 'printing') LIMIT 1", [id]);
  if (!open.length) {
    const now = new Date();
    const [targets] = await db.query<RowDataPacket[]>("SELECT p.deviceId, p.id AS printerId FROM print_printers p JOIN print_devices d ON d.id = p.deviceId WHERE d.status = 'online' AND p.enabled = 1 AND p.isDefault = 1 ORDER BY d.lastSeenAt DESC LIMIT 1");
    const target = targets[0];
    await db.query("INSERT INTO print_jobs (orderId, kind, status, idempotencyKey, deviceId, printerId, createdAt, updatedAt) VALUES (?, 'manual', 'pending', ?, ?, ?, ?, ?)", [id, "order-" + id + "-manual-" + crypto.randomUUID(), target?.deviceId || null, target?.printerId || null, now, now]);
  }
  return loadOrder(db, id);
}

export async function claimPrintJob(worker: string) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [jobs] = await conn.query<RowDataPacket[]>("SELECT id, orderId, attempts FROM print_jobs WHERE status = 'pending' AND deviceId IS NULL AND NOT EXISTS (SELECT 1 FROM print_devices d JOIN print_printers p ON p.deviceId = d.id WHERE d.status = 'online' AND p.enabled = 1 AND p.isDefault = 1) ORDER BY id LIMIT 1 FOR UPDATE");
    if (!jobs.length) {
      await conn.commit();
      return null;
    }
    const job = jobs[0];
    const attempts = Number(job.attempts) + 1;
    await conn.query("UPDATE print_jobs SET status = 'printing', attempts = ?, claimedBy = ?, updatedAt = ? WHERE id = ?", [attempts, worker.slice(0, 80), new Date(), job.id]);
    await conn.commit();
    const order = await loadOrder(getPool(), Number(job.orderId));
    if (!order) return null;
    const { settings } = await getSettings();
    return { id: Number(job.id), attempts, orderId: order.id, orderNumber: order.orderNumber, receiptText: buildReceipt(order, settings.matamly_banner_name || settings.matamly_name || "فتوش الخالدية") };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally { conn.release(); }
}

export async function finishPrintJob(id: number, ok: boolean, errorMessage: string) {
  const now = new Date();
  if (ok) {
    const [result] = await getPool().query<ResultSetHeader>("UPDATE print_jobs SET status = 'printed', lastError = '', confirmedAt = ?, updatedAt = ? WHERE id = ? AND status = 'printing'", [now, now, id]);
    if (!result.affectedRows) throw new RestaurantError("مهمة الطباعة غير جاهزة للتأكيد", 409);
    return;
  }
  const [result] = await getPool().query<ResultSetHeader>("UPDATE print_jobs SET status = 'failed', lastError = ?, updatedAt = ? WHERE id = ? AND status = 'printing'", [errorMessage.slice(0, 500) || "تعذرت الطباعة", now, id]);
  if (!result.affectedRows) throw new RestaurantError("مهمة الطباعة غير جاهزة لتسجيل الخطأ", 409);
}

export async function retryPrintJob(id: number) {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT attempts, status FROM print_jobs WHERE id = ?", [id]);
  if (!rows.length) throw new RestaurantError("مهمة الطباعة غير موجودة", 404);
  if (rows[0].status === "printed") throw new RestaurantError("تمت طباعة هذا الطلب بالفعل");
  if (Number(rows[0].attempts) >= 3) throw new RestaurantError("استنفدت محاولات الطباعة. استخدم إعادة الطباعة اليدوية.");
  const [result] = await getPool().query<ResultSetHeader>("UPDATE print_jobs SET status = 'pending', updatedAt = ? WHERE id = ? AND status = 'failed'", [new Date(), id]);
  if (!result.affectedRows) throw new RestaurantError("لا يمكن إعادة محاولة هذه المهمة الآن", 409);
}


export async function pairPrintDevice(input: { name: string; platform: PrintPlatform; appVersion?: string; capabilities?: unknown }) {
  const id = crypto.randomUUID();
  const token = createDeviceCredential();
  const now = new Date();
  await getPool().query(
    "INSERT INTO print_devices (id, name, platform, tokenHash, status, appVersion, capabilitiesJson, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)",
    [id, input.name.slice(0, 120), input.platform, sha256(token), String(input.appVersion || "").slice(0, 40), JSON.stringify(input.capabilities ?? {}), now, now],
  );
  return { id, token };
}

export async function authenticatePrintDevice(token: string) {
  if (!token || token.length > 128) return null;
  const [found] = await getPool().query<RowDataPacket[]>(
    "SELECT id, name, platform, status FROM print_devices WHERE tokenHash = ? LIMIT 1", [sha256(token)],
  );
  if (!found.length || found[0].status === "revoked") return null;
  return { id: String(found[0].id), name: String(found[0].name), platform: String(found[0].platform) };
}

export async function heartbeatPrintDevice(input: { id: string; appVersion?: string; capabilities?: unknown }) {
  const now = new Date();
  const [result] = await getPool().query<ResultSetHeader>(
    "UPDATE print_devices SET status = 'online', lastSeenAt = ?, appVersion = ?, capabilitiesJson = ?, updatedAt = ? WHERE id = ? AND status <> 'revoked'",
    [now, String(input.appVersion || "").slice(0, 40), JSON.stringify(input.capabilities ?? {}), now, input.id],
  );
  if (!result.affectedRows) throw new RestaurantError("جهاز الطباعة غير مسجل أو تم إلغاؤه", 401);
}

export async function listPrintDevices() {
  const [devices] = await getPool().query<RowDataPacket[]>("SELECT id, name, platform, status, lastSeenAt, appVersion, createdAt FROM print_devices ORDER BY createdAt DESC");
  const [printers] = await getPool().query<RowDataPacket[]>("SELECT id, deviceId, name, model, connectionType, address, isDefault, enabled, createdAt FROM print_printers ORDER BY createdAt DESC");
  return devices.map((device) => ({
    ...device,
    printers: printers.filter((printer) => String(printer.deviceId) === String(device.id)).map((printer) => ({
      ...printer, isDefault: Number(printer.isDefault) === 1, enabled: Number(printer.enabled) === 1,
    })),
  }));
}

export async function addPrintPrinter(input: { deviceId: string; name: string; model?: string; connectionType: PrintConnection; address?: string; isDefault?: boolean }) {
  const id = crypto.randomUUID();
  const now = new Date();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [device] = await conn.query<RowDataPacket[]>("SELECT id FROM print_devices WHERE id = ? AND status <> 'revoked' FOR UPDATE", [input.deviceId]);
    if (!device.length) throw new RestaurantError("الجهاز غير موجود", 404);
    if (input.isDefault) await conn.query("UPDATE print_printers SET isDefault = 0 WHERE deviceId = ?", [input.deviceId]);
    await conn.query(
      "INSERT INTO print_printers (id, deviceId, name, model, connectionType, address, isDefault, enabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
      [id, input.deviceId, input.name.slice(0, 120), String(input.model || "").slice(0, 120), input.connectionType, String(input.address || "").slice(0, 255), input.isDefault ? 1 : 0, now, now],
    );
    await conn.commit();
    return id;
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}

export async function updatePrintPrinter(id: string, input: { name: string; model?: string; connectionType: PrintConnection; address?: string; enabled: boolean; isDefault: boolean }) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RowDataPacket[]>("SELECT deviceId FROM print_printers WHERE id = ? FOR UPDATE", [id]);
    if (!rows.length) throw new RestaurantError("الطابعة غير موجودة", 404);
    const deviceId = String(rows[0].deviceId);
    if (input.isDefault) await conn.query("UPDATE print_printers SET isDefault = 0 WHERE deviceId = ?", [deviceId]);
    await conn.query(
      "UPDATE print_printers SET name = ?, model = ?, connectionType = ?, address = ?, enabled = ?, isDefault = ?, updatedAt = ? WHERE id = ?",
      [input.name.slice(0, 120), String(input.model || "").slice(0, 120), input.connectionType, String(input.address || "").slice(0, 255), input.enabled ? 1 : 0, input.isDefault ? 1 : 0, new Date(), id],
    );
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}

export async function revokePrintDevice(id: string) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("UPDATE print_devices SET status = 'revoked', updatedAt = ? WHERE id = ?", [new Date(), id]);
    await conn.query("UPDATE print_jobs SET status = 'failed', lastError = 'تم إلغاء تسجيل جهاز الطباعة', lastStage = 'failed', leaseUntil = NULL, updatedAt = ? WHERE deviceId = ? AND status IN ('pending','printing')", [new Date(), id]);
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}

export async function claimUniversalPrintJob(deviceId: string) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const now = new Date();
    await conn.query("UPDATE print_jobs SET status = 'failed', lastStage = 'uncertain', lastError = 'انتهت مهلة الجهاز؛ يلزم التحقق قبل إعادة الطباعة', leaseUntil = NULL, updatedAt = ? WHERE status = 'printing' AND leaseUntil IS NOT NULL AND leaseUntil < ?", [now, now]);
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT j.id, j.orderId, j.attempts, j.idempotencyKey, j.createdAt, p.id AS printerId, p.connectionType, p.address AS printerAddress FROM print_jobs j JOIN print_printers p ON p.deviceId = ? AND p.enabled = 1 AND p.isDefault = 1 JOIN print_devices d ON d.id = p.deviceId AND d.status <> 'revoked' WHERE j.status = 'pending' AND j.attempts < 3 AND j.updatedAt <= NOW() AND (j.deviceId IS NULL OR j.deviceId = ?) ORDER BY j.id LIMIT 1 FOR UPDATE",
      [deviceId, deviceId],
    );
    if (!rows.length) { await conn.commit(); return null; }
    const row = rows[0];
    const attempts = Number(row.attempts) + 1;
    const leaseUntil = new Date(now.getTime() + 60_000);
    await conn.query(
      "UPDATE print_jobs SET status = 'printing', attempts = ?, claimedBy = ?, deviceId = ?, printerId = ?, leaseUntil = ?, lastStage = 'claimed', updatedAt = ? WHERE id = ? AND status = 'pending'",
      [attempts, deviceId, deviceId, row.printerId, leaseUntil, now, row.id],
    );
    await conn.query("INSERT INTO print_job_events (jobId, deviceId, stage, status, message, createdAt) VALUES (?, ?, 'claimed', 'ok', 'تم حجز المهمة للجهاز', ?)", [row.id, deviceId, now]);
    await conn.commit();
    const order = await loadOrder(getPool(), Number(row.orderId));
    if (!order) return null;
    const { settings } = await getSettings();
    return {
      protocolVersion: 1, jobId: Number(row.id), idempotencyKey: String(row.idempotencyKey || ("job-" + row.id)),
      createdAt: new Date(row.createdAt).toISOString(),
      document: { encoding: "utf-8", contentType: "text/plain", receiptText: buildReceipt(order, settings.matamly_banner_name || settings.matamly_name || "فتوش الخالدية") },
      printer: { printerId: String(row.printerId), connectionType: String(row.connectionType), address: String(row.printerAddress || ""), commandSet: ["usb", "network", "bluetooth"].includes(String(row.connectionType)) ? "escpos" : "os-spool" },
      attempts,
    };
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}

export async function recordUniversalPrintStage(input: { jobId: number; deviceId: string; stage: PrintStage; status: "ok" | "failed" | "uncertain"; message?: string }) {
  const allowed: PrintStage[] = ["claimed", "agent_accepted", "submitted_to_spooler", "printer_acknowledged", "paper_confirmed", "failed", "uncertain"];
  if (!allowed.includes(input.stage)) throw new RestaurantError("مرحلة الطباعة غير صحيحة");
  const now = new Date();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [jobs] = await conn.query<RowDataPacket[]>("SELECT id, attempts FROM print_jobs WHERE id = ? AND deviceId = ? AND status = 'printing' FOR UPDATE", [input.jobId, input.deviceId]);
    if (!jobs.length) throw new RestaurantError("مهمة الطباعة غير مملوكة لهذا الجهاز أو انتهت صلاحيتها", 409);
    await conn.query("UPDATE print_jobs SET lastStage = ?, lastError = ?, leaseUntil = ?, updatedAt = ? WHERE id = ?", [
      input.stage, input.status === "ok" ? "" : String(input.message || input.status).slice(0, 500), new Date(now.getTime() + 60_000), now, input.jobId,
    ]);
    await conn.query("INSERT INTO print_job_events (jobId, deviceId, stage, status, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)", [
      input.jobId, input.deviceId, input.stage, input.status, String(input.message || "").slice(0, 500), now,
    ]);
    if (input.status === "ok" && ["submitted_to_spooler", "printer_acknowledged", "paper_confirmed"].includes(input.stage)) {
      // "printed" means the agent successfully handed the receipt to the printer transport.
      // confirmedAt is reserved for an actual paper sensor / completion confirmation.
      await conn.query("UPDATE print_jobs SET status = 'printed', confirmedAt = CASE WHEN ? = 'paper_confirmed' THEN ? ELSE confirmedAt END, leaseUntil = NULL WHERE id = ?", [input.stage, now, input.jobId]);
    } else if (input.stage === "failed") {
      const attempts = Number(jobs[0].attempts);
      const retryAt = new Date(now.getTime() + Math.min(60_000, 5_000 * (2 ** Math.max(0, attempts - 1))));
      await conn.query("UPDATE print_jobs SET status = ?, lastError = ?, leaseUntil = NULL, updatedAt = ? WHERE id = ?", [
        attempts < 3 ? "pending" : "failed", String(input.message || "تعذرت الطباعة").slice(0, 500), attempts < 3 ? retryAt : now, input.jobId,
      ]);
    } else if (input.stage === "uncertain") await conn.query("UPDATE print_jobs SET status = 'failed', lastError = ?, leaseUntil = NULL WHERE id = ?", [String(input.message || "نتيجة الطباعة غير مؤكدة").slice(0, 500), input.jobId]);
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}

export async function listRecentPrintJobs(limit = 50) {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT j.id, j.orderId, o.orderNumber, j.kind, j.status, j.attempts, j.lastError, j.lastStage, j.createdAt, j.updatedAt, d.name AS deviceName, p.name AS printerName FROM print_jobs j JOIN orders o ON o.id = j.orderId LEFT JOIN print_devices d ON d.id = j.deviceId LEFT JOIN print_printers p ON p.id = j.printerId ORDER BY j.id DESC LIMIT ?",
    [Math.max(1, Math.min(100, Math.floor(limit)))],
  );
  return rows;
}

export async function listPrintJobEvents(jobId: number) {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT id, jobId, deviceId, stage, status, message, createdAt FROM print_job_events WHERE jobId = ? ORDER BY id DESC LIMIT 100", [jobId]);
  return rows;
}

export async function createStaffSession(role: "admin" | "cashier", token: string) {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await getPool().query("INSERT INTO staff_sessions (token, role, expiresAt, createdAt) VALUES (?, ?, ?, ?)", [token, role, expires, now]);
}

export async function readStaffSession(token: string) {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT role, expiresAt FROM staff_sessions WHERE token = ?", [token]);
  if (!rows.length) return null;
  if (new Date(rows[0].expiresAt).getTime() < Date.now()) {
    await getPool().query("DELETE FROM staff_sessions WHERE token = ?", [token]);
    return null;
  }
  return String(rows[0].role) as "admin" | "cashier";
}

export async function deleteStaffSession(token: string) {
  await getPool().query("DELETE FROM staff_sessions WHERE token = ?", [token]);
}

export { rows };


export async function getProductRatingSummary() {
  const [found] = await getPool().query<RowDataPacket[]>(
    "SELECT productId, ROUND(AVG(rating), 1) AS average, COUNT(*) AS count FROM product_ratings GROUP BY productId",
  );
  return found.map((row) => ({ productId: String(row.productId), average: Number(row.average), count: Number(row.count) }));
}

export async function submitProductRating(input: { orderNumber: number; phone: string; productId: string; rating: number }) {
  if (!Number.isInteger(input.orderNumber) || input.orderNumber < 1) throw new RestaurantError("رقم الطلب غير صحيح");
  if (!/^\\+?[0-9\\s-]{7,20}$/.test(input.phone)) throw new RestaurantError("رقم الهاتف غير صحيح");
  if (!/^\\d+$/.test(input.productId) || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new RestaurantError("التقييم غير صحيح");
  const db = getPool();
  const [orders] = await db.query<RowDataPacket[]>(
    "SELECT id, status FROM orders WHERE orderNumber = ? AND customerPhone = ? LIMIT 1",
    [input.orderNumber, input.phone.trim()],
  );
  if (!orders.length) throw new RestaurantError("لم يتم العثور على الطلب بهذه البيانات", 404);
  if (orders[0].status !== "completed") throw new RestaurantError("يمكن تقييم الأصناف بعد استلام الطلب فقط");
  const orderId = Number(orders[0].id);
  const [items] = await db.query<RowDataPacket[]>(
    "SELECT id FROM order_items WHERE orderId = ? AND productId = ? LIMIT 1",
    [orderId, input.productId],
  );
  if (!items.length) throw new RestaurantError("هذا الصنف غير موجود في الطلب", 403);
  try {
    await db.query(
      "INSERT INTO product_ratings (orderId, productId, rating, createdAt) VALUES (?, ?, ?, ?)",
      [orderId, input.productId, input.rating, new Date()],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new RestaurantError("سبق تقييم هذا الصنف في هذا الطلب");
    throw error;
  }
  const [summary] = await db.query<RowDataPacket[]>(
    "SELECT ROUND(AVG(rating), 1) AS average, COUNT(*) AS count FROM product_ratings WHERE productId = ?",
    [input.productId],
  );
  return { productId: input.productId, average: Number(summary[0]?.average || 0), count: Number(summary[0]?.count || 0) };
}


export async function getRateableOrder(input: { orderNumber: number; phone: string }) {
  if (!Number.isInteger(input.orderNumber) || input.orderNumber < 1) throw new RestaurantError("رقم الطلب غير صحيح");
  const [orders] = await getPool().query<RowDataPacket[]>(
    "SELECT id, status FROM orders WHERE orderNumber = ? AND customerPhone = ? LIMIT 1",
    [input.orderNumber, input.phone.trim()],
  );
  if (!orders.length) throw new RestaurantError("لم يتم العثور على الطلب بهذه البيانات", 404);
  if (orders[0].status !== "completed") throw new RestaurantError("التقييم متاح بعد استلام الطلب فقط");
  const orderId = Number(orders[0].id);
  const [items] = await getPool().query<RowDataPacket[]>(
    "SELECT oi.productId, oi.name, pr.rating FROM order_items oi LEFT JOIN product_ratings pr ON pr.orderId = oi.orderId AND pr.productId = oi.productId WHERE oi.orderId = ? ORDER BY oi.id",
    [orderId],
  );
  return items.map((row) => ({ productId: String(row.productId), name: String(row.name), rating: row.rating == null ? null : Number(row.rating) }));
}
