import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initRestaurant, registerRestaurantRoutes } from "../restaurant-routes";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function startServer() {
  const app = express();
  const server = createServer(app);
  let ready = false;

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // Render must be able to detect the HTTP port even while MySQL is reconnecting.
  // Report readiness separately so callers never mistake a DB-unready instance for a ready one.
  app.get("/api/health", (_req, res) => {
    res.status(ready ? 200 : 503).json({
      status: ready ? "ok" : "starting",
      database: ready ? "ready" : "initializing",
    });
  });

  app.use((_req, res, next) => {
    if (!ready) {
      return res.status(503).json({ error: "Service is starting; database initialization is pending." });
    }
    next();
  });

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => {
    console.error("Server failed:", (error as Error).message);
    process.exit(1);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "0.0.0.0", () => {
      server.removeListener("error", reject);
      console.log(`Server listening on port ${port}; waiting for database initialization`);
      resolve();
    });
  });

  // Keep the web process available while the external MySQL service is temporarily
  // unreachable. Do not disable TLS or alter the database URL; retry initialization.
  let attempt = 0;
  while (!ready) {
    try {
      await initRestaurant();
      registerRestaurantRoutes(app);
      app.get("/api/platform/config.js", (_req, res) => {
        res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
      });
      registerOAuthRoutes(app);
      app.use(
        "/api/trpc",
        createExpressMiddleware({
          router: appRouter,
          createContext,
        }),
      );

      const development = process.env.NODE_ENV === "development" || process.argv.includes("--development");
      if (development) {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }

      ready = true;
      console.log("Restaurant database initialized; service is ready");
    } catch (error) {
      attempt += 1;
      console.error(`Restaurant initialization failed (attempt ${attempt}); retrying in 15 seconds:`, error);
      await sleep(15_000);
    }
  }
}

startServer().catch(error => {
  console.error("Fatal server startup error:", error);
  process.exit(1);
});
