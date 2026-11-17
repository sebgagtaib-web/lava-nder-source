import { describe, expect, it } from "vitest";
import { inPeriod, monthlySeries } from "./reports";

const now = new Date(2026, 10, 15); // 15 Nov 2026
const order = (created: Date, status: string, subtotal: number, cost: number) => ({
  created_at: created.toISOString(),
  status,
  subtotal,
  discount: 0,
  total_cost: cost,
  delivery_fee: 500,
});

describe("reports", () => {
  it("keeps only this month's orders for the 'month' period", () => {
    const rows = [order(new Date(2026, 10, 2), "delivered", 1000, 400), order(new Date(2026, 9, 30), "delivered", 1000, 400)];
    expect(inPeriod(rows, "month", now)).toHaveLength(1);
  });

  it("counts only delivered orders in monthly sales and profit, without delivery fees", () => {
    const rows = [
      order(new Date(2026, 10, 3), "delivered", 6000, 2500),
      order(new Date(2026, 10, 4), "cancelled", 9000, 3000),
      order(new Date(2026, 9, 10), "delivered", 2000, 800),
    ];
    const series = monthlySeries(rows, 2, now);
    expect(series.map((s) => [s.revenue, s.profit])).toEqual([
      [2000, 1200],
      [6000, 3500],
    ]);
  });
});
