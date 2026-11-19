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

function formatItemDetails(items: ReceiptOrder["items"]): string[] {
  const lines = ["تفاصيل الطلب للمطبخ"];

  items.forEach((item, index) => {
    if (index > 0) lines.push("------------------------------");

    lines.push(
      `القسم: ${item.category || "غير محدد"}`,
      `الكمية: ${item.qty}`,
      `الصنف: ${item.name}`,
    );

    const customization = [
      ...(item.description ? [item.description] : []),
      ...(item.choices || []),
    ].filter(Boolean);

    if (customization.length) {
      lines.push(`التخصيص: ${customization.join("، ")}`);
    }
  });

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
  lines.push("--------------------------------", ...formatItemDetails(order.items), "--------------------------------");
  lines.push(
    `قيمة الطعام: ${order.foodTotal.toFixed(3)} د.ك`,
    `رسوم التوصيل: ${order.deliveryFee.toFixed(3)} د.ك`,
    `الإجمالي: ${order.total.toFixed(3)} د.ك`,
    `طريقة الدفع: ${order.payment || "الدفع عند الاستلام"}`,
  );
  if (order.notes) lines.push(`ملاحظات الطلب: ${order.notes}`);
  return lines.join("\n");
}
