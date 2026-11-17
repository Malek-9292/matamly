import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildReceipt } from "./receipt";

describe("printer-independent receipt", () => {
  it("builds a plain receipt without vendor commands", () => {
    const receipt = buildReceipt({
      orderNumber: 12,
      createdAt: "2026-11-17T12:00:00.000Z",
      customer: { name: "أحمد", phone: "96550000000" },
      serviceMode: "delivery",
      zone: "الخالدية",
      address: "الخالدية - القطعة 4",
      notes: "بدون بصل",
      payment: "الدفع عند الاستلام",
      foodTotal: 2,
      deliveryFee: 0.5,
      total: 2.5,
      items: [{ name: "فلافل", qty: 2, price: 1, choices: ["بدون ثوم"] }],
    }, "فتوش الخالدية");
    expect(receipt).toContain("طلب رقم 12");
    expect(receipt).toContain("بدون ثوم");
    expect(receipt).not.toMatch(/ESC|TM-T20|Epson/i);
  });

  it("does not embed a printer brand in the ordering services", () => {
    const source = [
      readFileSync(new URL("./restaurant-routes.ts", import.meta.url), "utf8"),
      readFileSync(new URL("./restaurant-db.ts", import.meta.url), "utf8"),
      readFileSync(new URL("./receipt.ts", import.meta.url), "utf8"),
    ].join("\n");
    expect(source).not.toMatch(/Epson|TM-T20|ESC\/POS/i);
  });
});
