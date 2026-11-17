// Pure pricing rules shared by the browser (display) and the server (order creation).

export type PricedLine = {
  unitPrice: number;
  quantity: number;
  inBundle?: boolean | undefined;
};

export type BundleRule = { minItems: number; percent: number };

export type DeliveryRate = {
  office_price: number;
  home_price: number;
  office_enabled: boolean;
  home_enabled: boolean;
};

export type DeliveryType = "office" | "home";

const round = (n: number) => Math.round(n);

export function linesSubtotal(lines: PricedLine[]) {
  return round(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
}

/** Number of bundle pieces still missing before the discount unlocks (0 = unlocked). */
export function bundleItemsMissing(lines: PricedLine[], rule: BundleRule) {
  const qty = lines.filter((l) => l.inBundle).reduce((s, l) => s + l.quantity, 0);
  return Math.max(0, rule.minItems - qty);
}

/** Discount applied only to pieces chosen through the bundle builder, once enough pieces are chosen. */
export function bundleDiscount(lines: PricedLine[], rule: BundleRule) {
  if (rule.percent <= 0) return 0;
  if (bundleItemsMissing(lines, rule) > 0) return 0;
  const bundleSubtotal = lines
    .filter((l) => l.inBundle)
    .reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  return round((bundleSubtotal * rule.percent) / 100);
}

/** Delivery price for a wilaya and delivery type, or null when that option is not offered. */
export function deliveryFee(rate: DeliveryRate | null | undefined, type: DeliveryType): number | null {
  if (!rate) return null;
  if (type === "office") return rate.office_enabled ? Number(rate.office_price) : null;
  return rate.home_enabled ? Number(rate.home_price) : null;
}

/** Wholesale lines whose quantity is below the product's minimum order quantity. */
export function wholesaleMinimumViolations<T extends { quantity: number; minQuantity: number }>(lines: T[]) {
  return lines.filter((l) => l.quantity < l.minQuantity);
}

export function computeTotals(lines: PricedLine[], delivery: number, rule?: BundleRule) {
  const subtotal = linesSubtotal(lines);
  const discount = rule ? bundleDiscount(lines, rule) : 0;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

export type OrderMoney = {
  status: string;
  subtotal: number | string;
  discount: number | string;
  total_cost: number | string;
  delivery_fee: number | string;
};

/** Owner's profit on one order: what the customer pays for the goods minus what the goods cost. Delivery is passed on to the courier. */
export function orderProfit(o: OrderMoney) {
  return round(Number(o.subtotal) - Number(o.discount) - Number(o.total_cost));
}

/** Sales and profit only count delivered orders; cancelled and returned orders bring nothing in. */
export function summarizeOrders(orders: OrderMoney[]) {
  const delivered = orders.filter((o) => o.status === "delivered");
  return {
    count: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    inProgress: orders.filter((o) => o.status === "confirmed" || o.status === "shipped").length,
    delivered: delivered.length,
    revenue: round(delivered.reduce((s, o) => s + Number(o.subtotal) - Number(o.discount), 0)),
    profit: delivered.reduce((s, o) => s + orderProfit(o), 0),
  };
}
