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

/** Plain-text receipt for the operating-system print interface. No printer-vendor commands. */
export function buildReceipt(order: ReceiptOrder, restaurantName: string) {
  const when = new Date(order.createdAt);
  const stamp = Number.isNaN(when.getTime())
    ? order.createdAt
    : new Intl.DateTimeFormat("ar-KW", { timeZone: "Asia/Kuwait", dateStyle: "short", timeStyle: "short" }).format(when);
  const lines = [
    restaurantName || "فتوش الخالدية",
    `طلب رقم ${order.orderNumber}`,
    stamp,
    order.serviceMode === "delivery" ? "توصيل" : "استلام من المطعم",
    `${order.customer.name} - ${order.customer.phone}`,
  ];
  if (order.serviceMode === "delivery") {
    if (order.zone) lines.push(order.zone);
    if (order.address) lines.push(order.address);
  }
  lines.push("----------------");
  for (const item of order.items) {
    lines.push(`${item.qty} x ${item.name}  ${(item.price * item.qty).toFixed(3)}`);
    if (item.choices?.length) lines.push(`   ${item.choices.join("، ")}`);
  }
  lines.push("----------------");
  lines.push(`الطعام ${order.foodTotal.toFixed(3)}`);
  lines.push(`التوصيل ${order.deliveryFee.toFixed(3)}`);
  lines.push(`الإجمالي ${order.total.toFixed(3)}`);
  lines.push(order.payment || "الدفع عند الاستلام");
  if (order.notes) lines.push(`ملاحظات: ${order.notes}`);
  return lines.join("\n");
}
