import { orderProfit, type OrderMoney } from "@/lib/pricing";

export type Period = "month" | "30d" | "year" | "all";

/** Start of the reporting window for a period, or null for "all time". */
export function periodStart(period: Period, now: Date = new Date()): Date | null {
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "30d") return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

export function inPeriod<T extends { created_at: string }>(rows: T[], period: Period, now: Date = new Date()) {
  const start = periodStart(period, now);
  return start ? rows.filter((r) => new Date(r.created_at) >= start) : rows;
}

/** Delivered sales and profit per calendar month for the last `months` months (oldest first). */
export function monthlySeries(orders: (OrderMoney & { created_at: string })[], months: number, now: Date = new Date()) {
  const buckets: { key: string; year: number; month: number; revenue: number; profit: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, year: d.getFullYear(), month: d.getMonth(), revenue: 0, profit: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const o of orders) {
    if (o.status !== "delivered") continue;
    const d = new Date(o.created_at);
    const b = byKey.get(`${d.getFullYear()}-${d.getMonth() + 1}`);
    if (!b) continue;
    b.revenue += Math.round(Number(o.subtotal) - Number(o.discount));
    b.profit += orderProfit(o);
  }
  return buckets;
}
