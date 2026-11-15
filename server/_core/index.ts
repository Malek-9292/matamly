import "dotenv/config";
import express from "express";
import { createServer } from "http";
import crypto from "node:crypto";
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
  const orders = new Map<string, any>();
  const cookieOptions = "HttpOnly; Path=/; SameSite=None; Secure; Max-Age=86400";
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/api/orders", (req, res) => {
    const id = `ORD-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
    const order = { ...req.body, id, createdAt: new Date().toISOString(), status: "new" };
    orders.set(id, order);
    res.status(201).json({ ok: true, id });
  });
  app.get("/api/orders", (req, res) => {
    const match = req.headers.cookie?.match(/(?:^|; )restaurant_admin_session=([^;]+)/);
    if (!match || !adminSessions.has(match[1])) return res.status(401).json({ ok: false });
    res.json([...orders.values()].filter(order => order.status !== "printed").sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });
  app.patch("/api/orders/:id", (req, res) => {
    const match = req.headers.cookie?.match(/(?:^|; )restaurant_admin_session=([^;]+)/);
    if (!match || !adminSessions.has(match[1])) return res.status(401).json({ ok: false });
    const order = orders.get(req.params.id);
    if (!order) return res.status(404).json({ ok: false });
    orders.set(req.params.id, { ...order, ...req.body });
    res.json({ ok: true });
  });
  app.post("/api/admin/login", (req, res) => {
    const expected = process.env.ADMIN_PASSWORD || "";
    const received = typeof req.body?.password === "string" ? req.body.password : "";
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    const valid = expectedBuffer.length > 0 && expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    if (!valid) return res.status(401).json({ ok: false });
    const token = crypto.randomBytes(32).toString("hex");
    adminSessions.add(token);
    res.setHeader("Set-Cookie", `restaurant_admin_session=${token}; ${cookieOptions}`);
    return res.json({ ok: true });
  });
  app.post("/api/ai/product-image", async (req, res) => {
    const match = req.headers.cookie?.match(/(?:^|; )restaurant_admin_session=([^;]+)/);
    if (!match || !adminSessions.has(match[1])) return res.status(401).json({ ok: false });
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
    const match = req.headers.cookie?.match(/(?:^|; )restaurant_admin_session=([^;]+)/);
    res.json({ ok: !!match && adminSessions.has(match[1]) });
  });
  app.post("/api/admin/logout", (req, res) => {
    const match = req.headers.cookie?.match(/(?:^|; )restaurant_admin_session=([^;]+)/);
    if (match) adminSessions.delete(match[1]);
    res.setHeader("Set-Cookie", `restaurant_admin_session=; ${cookieOptions}; Max-Age=0`);
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
