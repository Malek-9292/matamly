import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("persistent Matamly store", () => {
  let folder = "";
  const originalDataFile = process.env.MATAMLY_DATA_FILE;
  afterEach(async () => { if (folder) await rm(folder, { recursive: true, force: true }); folder = ""; if (originalDataFile === undefined) delete process.env.MATAMLY_DATA_FILE; else process.env.MATAMLY_DATA_FILE = originalDataFile; vi.resetModules(); });

  it("persists orders and operational records between reads", async () => {
    folder = await mkdtemp(path.join(os.tmpdir(), "matamly-store-"));
    const dataPath = path.join(folder, "store.json");
    process.env.MATAMLY_DATA_FILE = dataPath;
    vi.resetModules();
    const storeApi = await import("./persistence");
    await storeApi.updateStore(store => {
      store.orders.push({ id: "ORD-1", total: 2.5 });
      store.inventory.push({ id: "STK-1", name: "دجاج", unit: "كجم", quantity: 4, minQuantity: 1, costPerUnit: 1.2, updatedAt: new Date().toISOString() });
      store.expenses.push({ id: "EXP-1", title: "خضروات", category: "مشتريات", amount: 0.75, date: "2026-11-15", notes: "", createdAt: new Date().toISOString() });
      store.settings.matamly_name = "مطعمي";
    });
    const loaded = await storeApi.readStore();
    expect(loaded.orders).toHaveLength(1);
    expect(loaded.inventory[0].quantity).toBe(4);
    expect(loaded.expenses[0].amount).toBe(0.75);
    expect(loaded.settings.matamly_name).toBe("مطعمي");
    expect(JSON.parse(await readFile(dataPath, "utf8")).orders).toHaveLength(1);
  });

  it("serializes concurrent writes without losing records", async () => {
    folder = await mkdtemp(path.join(os.tmpdir(), "matamly-store-"));
    process.env.MATAMLY_DATA_FILE = path.join(folder, "store.json");
    vi.resetModules();
    const storeApi = await import("./persistence");
    await Promise.all(Array.from({ length: 20 }, (_, i) => storeApi.updateStore(store => { store.orders.push({ id: `ORD-${i}` }); })));
    expect((await storeApi.readStore()).orders).toHaveLength(20);
  });
});
