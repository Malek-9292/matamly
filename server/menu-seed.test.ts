import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("preserved menu seed", () => {
  const products = JSON.parse(readFileSync(new URL("./seed/default-menu.json", import.meta.url), "utf8")) as { id: number; name: string; price: number; category: string }[];

  it("keeps all 133 existing products and their identities", () => {
    expect(products).toHaveLength(133);
    expect(new Set(products.map((product) => product.id)).size).toBe(133);
    expect(products.find((product) => product.id === 1)).toMatchObject({ name: "فلافل", price: 0.1, category: "السندويشات الخفيفة" });
    expect(products.some((product) => product.category === "سندويشات الصاج")).toBe(true);
    expect(products.some((product) => product.name.includes("صمون"))).toBe(true);
  });
});
