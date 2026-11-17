import { datetime, decimal, int, longtext, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const appSettings = mysqlTable("app_settings", {
  key: varchar("key", { length: 191 }).primaryKey(),
  value: longtext("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documents = mysqlTable("documents", {
  name: varchar("name", { length: 64 }).primaryKey(),
  body: longtext("body").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const deliveryAreas = mysqlTable("delivery_areas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  active: tinyint("active").notNull().default(1),
  minimumOrder: decimal("minimumOrder", { precision: 10, scale: 3 }).notNull().default("0.000"),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 3 }).notNull().default("0.000"),
  createdAt: datetime("createdAt").notNull(),
  updatedAt: datetime("updatedAt").notNull(),
});

export const deliveryGroups = mysqlTable("delivery_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  active: tinyint("active").notNull().default(1),
  minimumOrder: decimal("minimumOrder", { precision: 10, scale: 3 }).notNull().default("0.000"),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 3 }).notNull().default("0.000"),
  createdAt: datetime("createdAt").notNull(),
  updatedAt: datetime("updatedAt").notNull(),
});

export const deliveryGroupAreas = mysqlTable("delivery_group_areas", {
  areaId: int("areaId").primaryKey().references(() => deliveryAreas.id, { onDelete: "cascade" }),
  groupId: int("groupId").notNull().references(() => deliveryGroups.id, { onDelete: "cascade" }),
});

export const orderCounters = mysqlTable("order_counters", {
  id: int("id").primaryKey(),
  nextNumber: int("nextNumber").notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: int("orderNumber").notNull().unique(),
  legacyId: varchar("legacyId", { length: 80 }).unique(),
  clientRequestId: varchar("clientRequestId", { length: 64 }).unique(),
  customerName: varchar("customerName", { length: 100 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(),
  serviceMode: mysqlEnum("serviceMode", ["pickup", "delivery"]).notNull(),
  areaId: int("areaId"),
  areaName: varchar("areaName", { length: 120 }).notNull().default(""),
  address: varchar("address", { length: 500 }).notNull().default(""),
  notes: varchar("notes", { length: 500 }).notNull().default(""),
  payment: varchar("payment", { length: 60 }).notNull().default(""),
  foodTotal: decimal("foodTotal", { precision: 10, scale: 3 }).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 3 }).notNull(),
  minimumOrder: decimal("minimumOrder", { precision: 10, scale: 3 }).notNull().default("0.000"),
  minimumMet: tinyint("minimumMet").notNull().default(1),
  total: decimal("total", { precision: 10, scale: 3 }).notNull(),
  status: mysqlEnum("status", ["new", "processing", "ready", "completed", "cancelled"]).notNull().default("new"),
  createdAt: datetime("createdAt").notNull(),
  updatedAt: datetime("updatedAt").notNull(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("productId", { length: 32 }).notNull().default(""),
  name: varchar("name", { length: 120 }).notNull(),
  qty: int("qty").notNull(),
  price: decimal("price", { precision: 10, scale: 3 }).notNull(),
  choicesJson: text("choicesJson").notNull(),
});

export const printJobs = mysqlTable("print_jobs", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  kind: mysqlEnum("kind", ["auto", "manual"]).notNull(),
  status: mysqlEnum("status", ["pending", "printing", "printed", "failed"]).notNull().default("pending"),
  attempts: int("attempts").notNull().default(0),
  lastError: varchar("lastError", { length: 500 }).notNull().default(""),
  claimedBy: varchar("claimedBy", { length: 80 }).notNull().default(""),
  createdAt: datetime("createdAt").notNull(),
  updatedAt: datetime("updatedAt").notNull(),
  confirmedAt: datetime("confirmedAt"),
});

export const staffSessions = mysqlTable("staff_sessions", {
  token: varchar("token", { length: 64 }).primaryKey(),
  role: mysqlEnum("role", ["admin", "cashier"]).notNull(),
  expiresAt: datetime("expiresAt").notNull(),
  createdAt: datetime("createdAt").notNull(),
});