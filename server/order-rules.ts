import { normalizeOrderItems, type MenuProduct } from "./order-validation";
import { money, resolveDeliverySelection, type AreaRule, type GroupRule } from "./delivery-rules";

export type ServiceMode = "pickup" | "delivery";

export function normalizeServiceMode(value: unknown): ServiceMode | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "pickup" || text === "استلام من المطعم" || text === "Restaurant pickup") return "pickup";
  if (text === "delivery" || text === "التوصيل" || text === "Delivery") return "delivery";
  return null;
}

export function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export type PreparedOrder = {
  serviceMode: ServiceMode;
  customerName: string;
  customerPhone: string;
  areaId: number | null;
  areaName: string;
  address: string;
  notes: string;
  payment: string;
  foodTotal: number;
  deliveryFee: number;
  minimumOrder: number;
  minimumMet: boolean;
  total: number;
  items: { productId: number | string; name: string; category?: string; description?: string; qty: number; price: number; choices: string[] }[];
};

const requiredAddressFields = ["block", "street", "house"] as const;
const addressFields = ["block", "street", "avenue", "house", "floor", "apartment"] as const;

export function prepareOrder(
  body: Record<string, unknown>,
  menu: MenuProduct[],
  areas: AreaRule[],
  groups: GroupRule[],
): { ok: true; order: PreparedOrder } | { ok: false; error: string } {
  const customer = (body.customer && typeof body.customer === "object" ? body.customer : {}) as Record<string, unknown>;
  const name = cleanText(customer.name, 100);
  const phone = cleanText(customer.phone, 30);
  if (name.length < 2 || !/^[+0-9\s()-]{6,30}$/.test(phone)) {
    return { ok: false, error: "يرجى إدخال اسم ورقم هاتف صحيحين" };
  }
  const serviceMode = normalizeServiceMode(body.serviceMode);
  if (!serviceMode) return { ok: false, error: "طريقة الاستلام غير صحيحة" };
  const submitted = body.items;
  if (!Array.isArray(submitted) || submitted.length < 1 || submitted.length > 60) {
    return { ok: false, error: "قائمة الأصناف غير صحيحة" };
  }
  if (menu.length === 0) return { ok: false, error: "قائمة المطعم غير مفعلة على الخادم" };
  const normalized = normalizeOrderItems(submitted, menu, cleanText);
  if (normalized.error || normalized.items.some((item) => item.productId === undefined)) {
    return { ok: false, error: normalized.error || "بيانات أحد الأصناف غير صحيحة" };
  }
  const items = normalized.items.map((item) => ({
    productId: item.productId as number | string,
    name: item.name,
    category: item.category,
    description: item.description,
    qty: item.qty,
    price: money(item.price),
    choices: item.choices,
  }));
  const foodTotal = money(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  const notes = cleanText(body.notes, 500);
  const payment = cleanText(body.payment, 60) || "الدفع عند الاستلام";

  if (serviceMode === "pickup") {
    return {
      ok: true,
      order: {
        serviceMode,
        customerName: name,
        customerPhone: phone,
        areaId: null,
        areaName: "",
        address: "",
        notes,
        payment,
        foodTotal,
        deliveryFee: 0,
        minimumOrder: 0,
        minimumMet: true,
        total: foodTotal,
        items,
      },
    };
  }

  const parts = (body.addressParts && typeof body.addressParts === "object" ? body.addressParts : {}) as Record<string, unknown>;
  const addressValues = Object.fromEntries(addressFields.map((field) => [field, cleanText(parts[field], 80)])) as Record<(typeof addressFields)[number], string>;
  if (requiredAddressFields.some((field) => addressValues[field].length < 1)) {
    return { ok: false, error: "يرجى إدخال عنوان التوصيل كاملاً" };
  }
  const areaId = Number(body.areaId);
  if (!Number.isInteger(areaId) || areaId < 1) return { ok: false, error: "يرجى اختيار منطقة التوصيل" };
  const selected = resolveDeliverySelection(areaId, areas, groups);
  if (!selected.ok) return selected;
  if (foodTotal < selected.area.minimumOrder) {
    return { ok: false, error: `الحد الأدنى للتوصيل إلى ${selected.area.name} هو ${selected.area.minimumOrder.toFixed(3)} د.ك` };
  }
  const address = [
    selected.area.name,
    `القطعة ${addressValues.block}`,
    `الشارع ${addressValues.street}`,
    addressValues.avenue ? `الجادة ${addressValues.avenue}` : "",
    `المنزل ${addressValues.house}`,
    addressValues.floor ? `الدور ${addressValues.floor}` : "",
    addressValues.apartment ? `الشقة ${addressValues.apartment}` : "",
  ].filter(Boolean).join(" - ");
  const deliveryFee = selected.area.deliveryFee;
  return {
    ok: true,
    order: {
      serviceMode,
      customerName: name,
      customerPhone: phone,
      areaId: selected.area.id,
      areaName: selected.area.name,
      address,
      notes,
      payment,
      foodTotal,
      deliveryFee,
      minimumOrder: selected.area.minimumOrder,
      minimumMet: true,
      total: money(foodTotal + deliveryFee),
      items,
    },
  };
}
