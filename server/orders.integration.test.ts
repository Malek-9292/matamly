import { createServer } from "node:http";
import express from "express";
import { afterAll, describe, expect, it } from "vitest";

const enabled = Boolean(process.env.DATABASE_URL);
describe.skipIf(!enabled)("persistent orders", () => {
  let server: ReturnType<typeof createServer> | undefined;

  afterAll(async () => { if (!server) return; await new Promise<void>((resolve) => server?.close(() => resolve())); });

  it("stores sequential orders, enforces roles, and confirms print jobs", async () => {
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin-test-password";
    process.env.CASHIER_PASSWORD = process.env.CASHIER_PASSWORD || "cashier-test-password";
    process.env.PRINT_AGENT_TOKEN = process.env.PRINT_AGENT_TOKEN || "print-test-token";
    const { initRestaurant, registerRestaurantRoutes } = await import("./restaurant-routes");
    const db = await import("./restaurant-db");
    await initRestaurant();
    const app = express();
    app.use(express.json());
    registerRestaurantRoutes(app);
    server = createServer(app);
    await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port");
    const base = `http://127.0.0.1:${address.port}`;

    const created = await Promise.all(Array.from({ length: 8 }, (_, index) => fetch(`${base}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientRequestId: `it-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`, customer: { name: "عميل", phone: "96553333333" }, serviceMode: "pickup", items: [{ id: 1, qty: 1, choices: [] }] }),
    }).then(async (response) => ({ status: response.status, body: await response.json() }))));
    expect(created.every((order) => order.status === 201)).toBe(true);
    const numbers = created.map((order) => Number(order.body.orderNumber));
    expect(new Set(numbers).size).toBe(numbers.length);

    const cashierLogin = await fetch(`${base}/api/cashier/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: process.env.CASHIER_PASSWORD }) });
    const cashierCookie = cashierLogin.headers.get("set-cookie")?.split(";")[0] || "";
    expect(cashierLogin.status).toBe(200);
    const forbidden = await fetch(`${base}/api/settings`, { method: "PUT", headers: { "Content-Type": "application/json", Cookie: cashierCookie }, body: JSON.stringify({ revision: 0, settings: { matamly_name: "تغيير غير مسموح" } }) });
    expect(forbidden.status).toBe(403);
    const history = await fetch(`${base}/api/orders`, { headers: { Cookie: cashierCookie } }).then((response) => response.json()) as { orderNumber: number }[];
    expect(history.some((order) => numbers.includes(order.orderNumber))).toBe(true);

    const adminLogin = await fetch(`${base}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }) });
    const adminCookie = adminLogin.headers.get("set-cookie")?.split(";")[0] || "";
    const stamp = Date.now();
    const areaResponse = await fetch(`${base}/api/admin/areas`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: adminCookie }, body: JSON.stringify({ name: `منطقة اختبار ${stamp}`, active: true, minimumOrder: 5, deliveryFee: 1.25 }) });
    const areaBody = await areaResponse.json() as { id: number };
    expect(areaResponse.status).toBe(201);
    const denied = await fetch(`${base}/api/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: { name: "عميل", phone: "96554444444" }, serviceMode: "delivery", areaId: areaBody.id, deliveryFee: 0, items: [{ id: 1, qty: 1, price: 0.001 }], addressParts: { block: "1", street: "2", avenue: "3", floor: "4", apartment: "5", house: "6" } }) });
    expect(denied.status).toBe(400);
    const group = await fetch(`${base}/api/admin/groups`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: adminCookie }, body: JSON.stringify({ name: `مجموعة ${stamp}`, active: true, minimumOrder: 2, deliveryFee: 0.75, areaIds: [areaBody.id] }) });
    expect(group.status).toBe(201);
    const conflict = await fetch(`${base}/api/admin/groups`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: adminCookie }, body: JSON.stringify({ name: `تعارض ${stamp}`, active: true, minimumOrder: 1, deliveryFee: 1, areaIds: [areaBody.id] }) });
    expect(conflict.status).toBe(400);

    const claim = await fetch(`${base}/api/print-agent/jobs/claim`, { headers: { Authorization: `Bearer ${process.env.PRINT_AGENT_TOKEN}` } }).then((response) => response.json()) as { job: { id: number; receiptText: string } | null };
    expect(claim.job?.receiptText).toContain("طلب رقم");
    const result = await fetch(`${base}/api/print-agent/jobs/${claim.job?.id}/result`, { method: "POST", headers: { Authorization: `Bearer ${process.env.PRINT_AGENT_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) });
    expect(result.status).toBe(200);
    const again = await fetch(`${base}/api/print-agent/jobs/${claim.job?.id}/result`, { method: "POST", headers: { Authorization: `Bearer ${process.env.PRINT_AGENT_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) });
    expect(again.status).toBe(409);
    expect((await db.listOrders()).some((order) => order.printStatus === "printed")).toBe(true);
  }, 60000);
});
