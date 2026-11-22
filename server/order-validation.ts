export type MenuProduct = {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  options?: string[];
  customizationGroups?: { id: string; name: string; required?: boolean; selection?: "single" | "multiple"; hidden?: boolean; options: { id: string; name: string; price?: number }[] }[];
  category?: string;
  hidden?: boolean;
};

export type SubmittedOrderItem = {
  id?: number | string;
  name?: unknown;
  qty?: unknown;
  price?: unknown;
  choices?: unknown;
  customizations?: unknown;
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
    const legacyChoices = Array.isArray(raw?.choices) ? raw.choices.slice(0, 12).map((choice) => cleanText(choice, 120)) : [];
    if (legacyChoices.some((choice) => !choice)) return { items: [], error: "أحد الاختيارات غير صحيح" };
    const submittedCustomizations = Array.isArray(raw?.customizations) ? raw.customizations.slice(0, 40) : [];
    const choices = [...legacyChoices];

    if (menu.length > 0) {
      const product = menu.find((candidate) => String(candidate.id) === String(raw?.id));
      if (!product || product.hidden) return { items: [], error: "أحد الأصناف لم يعد متاحاً. حدّث القائمة وحاول مرة أخرى." };
      const price = Number(product.price);
      const name = cleanText(product.name, 120);
      if (!name || !Number.isFinite(price) || price < 0 || price > 1000) {
        return { items: [], error: "بيانات أحد الأصناف غير صالحة في قائمة المطعم" };
      }
      const allowedChoices = Array.isArray(product.options) ? product.options : [];
      if (legacyChoices.some((choice) => !allowedChoices.includes(choice))) return { items: [], error: `اختيارات صنف ${name} تغيرت. حدّث القائمة وحاول مرة أخرى.` };
      let extraPrice = 0;
      const groups = Array.isArray(product.customizationGroups) ? product.customizationGroups : [];
      const seenGroups = new Set<string>();
      for (const rawSelection of submittedCustomizations) {
        if (!rawSelection || typeof rawSelection !== "object") return { items: [], error: "بيانات التخصيص غير صحيحة" };
        const selection = rawSelection as Record<string, unknown>;
        const group = groups.find((candidate) => candidate.id === String(selection.groupId || ""));
        if (!group || group.hidden) return { items: [], error: `تخصيص صنف ${name} لم يعد متاحاً. حدّث القائمة.` };
        const option = group.options.find((candidate) => candidate.id === String(selection.optionId || ""));
        if (!option) return { items: [], error: `اختيار في تخصيص صنف ${name} غير متاح.` };
        if (group.selection !== "multiple" && seenGroups.has(group.id)) return { items: [], error: `اختر اختياراً واحداً فقط من ${group.name}.` };
        seenGroups.add(group.id);
        const optionPrice = Number(option.price) || 0;
        if (!Number.isFinite(optionPrice) || optionPrice < 0 || optionPrice > 1000) return { items: [], error: "سعر أحد التخصيصات غير صالح." };
        extraPrice += optionPrice;
        choices.push(`${cleanText(group.name, 80)}: ${cleanText(option.name, 80)}${optionPrice > 0 ? ` (+${optionPrice.toFixed(3)} د.ك)` : ""}`);
      }
      for (const group of groups) {
        if (!group.hidden && group.required && !submittedCustomizations.some((entry) => entry && typeof entry === "object" && String((entry as Record<string, unknown>).groupId || "") === group.id)) return { items: [], error: `يرجى اختيار ${group.name} لصنف ${name}.` };
      }
      if (submittedCustomizations.length && !groups.length) return { items: [], error: "التخصيصات المرسلة غير متاحة لهذا الصنف." };
      items.push({ productId: product.id, name, category: cleanText(product.category, 100), description: cleanText(product.description, 240), qty, price: Number((price + extraPrice).toFixed(3)), choices });
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
