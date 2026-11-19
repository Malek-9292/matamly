export type ReceiptOrder = {
  orderNumber: number;
  createdAt: string;
  customer: { name: string; phone: string };
  serviceMode: "pickup" | "delivery";
  zone: string;
  address: string;
  notes: string;
  payment: string;
  foodTotal: number;
  deliveryFee: number;
  total: number;
  items: { name: string; category?: string; description?: string; qty: number; price: number; choices?: string[] }[];
};

const ITEM_COLUMNS = [10, 10, 5, 8] as const;
const ITEM_SEPARATOR = " | ";
const ITEM_LINE_WIDTH = ITEM_COLUMNS.reduce((sum, width) => sum + width, 0) + ITEM_SEPARATOR.length * 3;

function wrapCell(value: string, width: number): string[] {
  const words = Array.from(value.trim() || "-");
  const result: string[] = [];
  let line = "";

  for (const word of words) {
    if (Array.from(line).length >= width) {
      result.push(line);
      line = "";
    }
    line += word;
  }

  if (line || result.length === 0) result.push(line);
  return result;
}

function wrapCellWords(value: string, width: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (Array.from(candidate).length <= width) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (Array.from(word).length <= width) {
      line = word;
    } else {
      const parts = wrapCell(word, width);
      lines.push(...parts.slice(0, -1));
      line = parts[parts.length - 1] || "";
    }
  }

  if (line || lines.length === 0) lines.push(line);
  return lines;
}

function formatItemTable(items: ReceiptOrder["items"]): string[] {
  const widths = ITEM_COLUMNS;
  const header = ["القسم", "اسم الصنف", "الكمية", "تخصيص"];
  const lines = [
    "تفاصيل الطلب للمطبخ",
    header.map((cell, index) => wrapCellWords(cell, widths[index])[0].padEnd(widths[index], " ")).join(ITEM_SEPARATOR),
    "-".repeat(ITEM_LINE_WIDTH),
  ];

  for (const item of items) {
    const customization = [
      ...(item.description ? [item.description] : []),
      ...(item.choices || []),
    ].join("، ");
    const cells = [
      item.category || "-",
      item.name || "-",
      String(item.qty),
      customization,
    ];
    const wrapped = cells.map((cell, index) => wrapCellWords(cell, widths[index]));
    const rowHeight = Math.max(...wrapped.map((cell) => cell.length));

    for (let row = 0; row < rowHeight; row++) {
      lines.push(
        wrapped
          .map((cell, index) => (cell[row] || "").padEnd(widths[index], " "))
          .join(ITEM_SEPARATOR)
          .trimEnd(),
      );
    }
  }

  return lines;
}

/** One complete, plain-text receipt. Keep customer and kitchen details together. */
export function buildReceipt(order: ReceiptOrder, restaurantName: string) {
  const when = new Date(order.createdAt);
  const stamp = Number.isNaN(when.getTime())
    ? order.createdAt
    : new Intl.DateTimeFormat("ar-KW", { timeZone: "Asia/Kuwait", dateStyle: "short", timeStyle: "short" }).format(when);
  const lines = [
    restaurantName || "فتوش الخالدية",
    "================================",
    `طلب رقم: ${order.orderNumber}    ${stamp}`,
    order.serviceMode === "delivery" ? "**** طلب توصيل ****" : "**** استلام من المطعم ****",
    "--------------------------------",
    "بيانات العميل",
    `الاسم: ${order.customer.name}`,
    `الهاتف: ${order.customer.phone}`,
  ];
  if (order.serviceMode === "delivery") {
    if (order.zone) lines.push(`المنطقة: ${order.zone}`);
    if (order.address) lines.push(`العنوان: ${order.address}`);
  }
  lines.push("--------------------------------", ...formatItemTable(order.items), "--------------------------------");
  lines.push(
    `قيمة الطعام: ${order.foodTotal.toFixed(3)} د.ك`,
    `رسوم التوصيل: ${order.deliveryFee.toFixed(3)} د.ك`,
    `الإجمالي: ${order.total.toFixed(3)} د.ك`,
    `طريقة الدفع: ${order.payment || "الدفع عند الاستلام"}`,
  );
  if (order.notes) lines.push(`ملاحظات الطلب: ${order.notes}`);
  return lines.join("\n");
}
