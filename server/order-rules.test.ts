import { describe, expect, it } from "vitest";
import { prepareOrder } from "./order-rules";
import { findAreaConflicts } from "./delivery-rules";

const menu = [
  { id: 1, name: "فلافل", price: 0.1, options: ["بدون ثوم", "زيادة طحينة"] },
  { id: 2, name: "صمون حمص سلطة", price: 0.25, category: "السندويشات الخفيفة" },
];
const areas = [
  { id: 4, name: "الخالدية", active: true, minimumOrder: 1.5, deliveryFee: 0.5 },
  { id: 5, name: "كيفان", active: true, minimumOrder: 9, deliveryFee: 2 },
  { id: 6, name: "السالمية", active: false, minimumOrder: 1, deliveryFee: 1 },
];
const groups = [
  { id: 1, name: "كيفان والعديلية", active: true, minimumOrder: 2, deliveryFee: 0.75, areaIds: [5] },
];

const customer = { name: "أحمد", phone: "96550000000" };
const addressParts = { block: "4", street: "1", avenue: "2", floor: "3", apartment: "12", house: "8" };

describe("prepareOrder", () => {
  it("accepts pickup with name and phone and ignores delivery fees", () => {
    const result = prepareOrder({ customer, serviceMode: "استلام من المطعم", items: [{ id: 1, qty: 1, price: 0.001, choices: ["بدون ثوم"] }], deliveryFee: 5, areaId: 4, addressParts }, menu, areas, groups);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.deliveryFee).toBe(0);
    expect(result.order.minimumOrder).toBe(0);
    expect(result.order.total).toBe(0.1);
    expect(result.order.items[0].price).toBe(0.1);
    expect(result.order.address).toBe("");
  });

  it("applies the area rule on the server", () => {
    const below = prepareOrder({ customer, serviceMode: "delivery", areaId: 4, addressParts, items: [{ id: 1, qty: 1 }] }, menu, areas, groups);
    expect(below.ok).toBe(false);
    const above = prepareOrder({ customer, serviceMode: "delivery", areaId: 4, addressParts, items: [{ id: 2, qty: 8, price: 0 }] }, menu, areas, groups);
    expect(above.ok).toBe(true);
    if (!above.ok) return;
    expect(above.order.deliveryFee).toBe(0.5);
    expect(above.order.minimumOrder).toBe(1.5);
    expect(above.order.foodTotal).toBe(2);
    expect(above.order.total).toBe(2.5);
  });

  it("allows driver KNET for delivery and rejects it for pickup", () => {
    const delivery = prepareOrder({ customer, serviceMode: "delivery", areaId: 4, addressParts, payment: "KNET مع السائق", items: [{ id: 2, qty: 8 }] }, menu, areas, groups);
    expect(delivery.ok).toBe(true);
    const pickup = prepareOrder({ customer, serviceMode: "pickup", payment: "KNET مع السائق", items: [{ id: 2, qty: 8 }] }, menu, areas, groups);
    expect(pickup.ok).toBe(false);
  });

  it("uses the group rule and rejects inactive areas", () => {
    const grouped = prepareOrder({ customer, serviceMode: "التوصيل", areaId: 5, addressParts, items: [{ id: 2, qty: 8 }] }, menu, areas, groups);
    expect(grouped.ok).toBe(true);
    if (grouped.ok) expect(grouped.order.deliveryFee).toBe(0.75);
    const inactive = prepareOrder({ customer, serviceMode: "delivery", areaId: 6, addressParts, items: [{ id: 2, qty: 8 }] }, menu, areas, groups);
    expect(inactive.ok).toBe(false);
  });

  it("requires a complete delivery address and keeps prices off the client", () => {
    const missing = prepareOrder({ customer, serviceMode: "delivery", areaId: 4, items: [{ id: 2, qty: 8 }] }, menu, areas, groups);
    expect(missing.ok).toBe(false);
    const wrongChoice = prepareOrder({ customer, serviceMode: "pickup", items: [{ id: 1, qty: 1, choices: ["عربي"] }] }, menu, areas, groups);
    expect(wrongChoice.ok).toBe(false);
  });
});

describe("delivery group conflicts", () => {
  it("rejects an area that already belongs to another group", () => {
    expect(findAreaConflicts([5, 7], [{ areaId: 5, groupId: 1 }], 2)).toEqual([{ areaId: 5, groupId: 1 }]);
    expect(findAreaConflicts([5], [{ areaId: 5, groupId: 1 }], 1)).toEqual([]);
  });
});
