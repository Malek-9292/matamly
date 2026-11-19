export type MenuProduct = {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  options?: string[];
  category?: string;
  hidden?: boolean;
};

export type SubmittedOrderItem = {
  id?: number | string;
  name?: unknown;
  qty?: unknown;
  price?: unknown;
  choices?: unknown;
};

export type NormalizedOrderItem = {
  productId?: number | string;
  name: string;
  category?: string;
  description?: string;
  qty: number;
  price: number;
  choices: string[];
};

/**
 * Prefer the server-side menu as the source of truth. The legacy fallback is
 * retained only for installations whose menu has not yet been synced to the
 * server; it can be removed after all deployments have migrated.
 */
export function normalizeOrderItems(
  submitted: SubmittedOrderItem[],
  menu: MenuProduct[],
  cleanText: (value: unknown, max?: number) => string,
): { items: NormalizedOrderItem[]; error?: string } {
  const items: NormalizedOrderItem[] = [];
  for (const raw of submitted) {
    const qty = Number(raw?.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
      return { items: [], error: "كمية أحد الأصناف غير صحيحة" };
    }
    const choices = Array.isArray(raw?.choices)
      ? raw.choices.slice(0, 12).map((choice) => cleanText(choice, 80))
      : [];
    if (choices.some((choice) => !choice)) {
      return { items: [], error: "أحد الاختيارات غير صحيح" };
    }

    if (menu.length > 0) {
      const product = menu.find((candidate) => String(candidate.id) === String(raw?.id));
      if (!product || product.hidden) return { items: [], error: "أحد الأصناف لم يعد متاحاً. حدّث القائمة وحاول مرة أخرى." };
      const price = Number(product.price);
      const name = cleanText(product.name, 120);
      if (!name || !Number.isFinite(price) || price < 0 || price > 1000) {
        return { items: [], error: "بيانات أحد الأصناف غير صالحة في قائمة المطعم" };
      }
      const allowedChoices = Array.isArray(product.options) ? product.options : [];
      if (choices.some((choice) => !allowedChoices.includes(choice))) {
        return { items: [], error: `اختيارات صنف ${name} تغيرت. حدّث القائمة وحاول مرة أخرى.` };
      }
      items.push({ productId: product.id, name, category: cleanText(product.category, 100), description: cleanText(product.description, 240), qty, price, choices });
      continue;
    }

    // Backward-compatible mode for a fresh installation before menu sync.
    const name = cleanText(raw?.name, 120);
    const price = Number(raw?.price);
    if (!name || !Number.isFinite(price) || price < 0 || price > 1000) {
      return { items: [], error: "بيانات أحد الأصناف غير صحيحة" };
    }
    items.push({ name, qty, price, choices });
  }
  return { items };
}
