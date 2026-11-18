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
  items: { name: string; qty: number; price: number; choices?: string[] }[];
};

/** One complete, plain-text receipt. Keep customer and kitchen details together. */
export function buildReceipt(order: ReceiptOrder, restaurantName: string) {
  const when = new Date(order.createdAt);
  const stamp = Number.isNaN(when.getTime())
    ? order.createdAt
    : new Intl.DateTimeFormat("ar-KW", { timeZone: "Asia/Kuwait", dateStyle: "short", timeStyle: "short" }).format(when);
  const lines = [
    restaurantName || "فتوش الخالدية",
    "================================",
    `رقم الطلب: ${order.orderNumber}`,
    `التاريخ والوقت: ${stamp}`,
    order.serviceMode === "delivery" ? "طريقة الطلب: توصيل" : "طريقة الطلب: استلام من المطعم",
    "--------------------------------",
    "بيانات العميل",
    `الاسم: ${order.customer.name}`,
    `الهاتف: ${order.customer.phone}`,
  ];
  if (order.serviceMode === "delivery") {
    if (order.zone) lines.push(`المنطقة: ${order.zone}`);
    if (order.address) lines.push(`العنوان: ${order.address}`);
  }
  lines.push("--------------------------------", "تفاصيل الطلب");
  for (const item of order.items) {
    lines.push(`${item.name}`, `الكمية: ${item.qty}    السعر: ${(item.price * item.qty).toFixed(3)} د.ك`);
    if (item.choices?.length) lines.push(`الاختيارات: ${item.choices.join("، ")}`);
    lines.push("--------------------------------");
  }
  lines.push(
    `قيمة الطعام: ${order.foodTotal.toFixed(3)} د.ك`,
    `رسوم التوصيل: ${order.deliveryFee.toFixed(3)} د.ك`,
    `الإجمالي: ${order.total.toFixed(3)} د.ك`,
    `طريقة الدفع: ${order.payment || "الدفع عند الاستلام"}`,
  );
  if (order.notes) lines.push(`ملاحظات الطلب: ${order.notes}`);
  return lines.join("\\n");
}
