import { describe, expect, it } from "vitest";
import { normalizeOrderItems } from "./order-validation";

const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";

describe("order item validation", () => {
  const menu = [
    { id: 7, name: "شيش طاووق", price: 1.5, options: ["بدون ثوم", "زيادة مخلل"] },
  ];

  it("uses the server menu price instead of a client-submitted price", () => {
    const result = normalizeOrderItems([{ id: 7, name: "شيش طاووق", qty: 2, price: 0.001 }], menu, clean);
    expect(result.error).toBeUndefined();
    expect(result.items[0].price).toBe(1.5);
    expect(result.items[0].name).toBe("شيش طاووق");
  });

  it("rejects products that are missing or hidden", () => {
    expect(normalizeOrderItems([{ id: 99, qty: 1 }], menu, clean).error).toBeTruthy();
    expect(normalizeOrderItems([{ id: 7, qty: 1 }], [{ ...menu[0], hidden: true }], clean).error).toBeTruthy();
  });

  it("rejects choices that are not configured for the product", () => {
    const result = normalizeOrderItems([{ id: 7, qty: 1, choices: ["سعر خاص"] }], menu, clean);
    expect(result.error).toContain("اختيارات");
  });

  it("rejects invalid quantities", () => {
    expect(normalizeOrderItems([{ id: 7, qty: 0 }], menu, clean).error).toBeTruthy();
  });
});
