import { describe, expect, it } from "vitest";
import { bundleDiscount, bundleItemsMissing, computeTotals, deliveryFee, orderProfit, summarizeOrders, wholesaleMinimumViolations } from "./pricing";

const rule = { minItems: 3, percent: 10 };

describe("bundle discount", () => {
  it("gives no discount with fewer pieces than the minimum", () => {
    const lines = [{ unitPrice: 2000, quantity: 2, inBundle: true }];
    expect(bundleDiscount(lines, rule)).toBe(0);
    expect(bundleItemsMissing(lines, rule)).toBe(1);
  });

  it("applies the percentage to bundle pieces only once the minimum is reached", () => {
    const lines = [
      { unitPrice: 2000, quantity: 3, inBundle: true },
      { unitPrice: 5000, quantity: 1, inBundle: false },
    ];
    expect(bundleDiscount(lines, rule)).toBe(600);
  });
});

describe("delivery fee", () => {
  const rate = { office_price: 400, home_price: 700, office_enabled: true, home_enabled: false };
  it("uses the office price for office delivery", () => {
    expect(deliveryFee(rate, "office")).toBe(400);
  });
  it("returns null when home delivery is disabled for the wilaya", () => {
    expect(deliveryFee(rate, "home")).toBeNull();
  });
});

describe("wholesale minimum quantity", () => {
  it("flags lines below the product minimum", () => {
    const lines = [
      { id: "a", quantity: 9, minQuantity: 10 },
      { id: "b", quantity: 10, minQuantity: 10 },
    ];
    expect(wholesaleMinimumViolations(lines).map((l) => l.id)).toEqual(["a"]);
  });
});

describe("totals", () => {
  it("adds delivery and subtracts the bundle discount", () => {
    const lines = [{ unitPrice: 1000, quantity: 3, inBundle: true }];
    expect(computeTotals(lines, 500, rule)).toEqual({ subtotal: 3000, discount: 300, delivery: 500, total: 3200 });
  });
});

describe("owner profit", () => {
  const base = { subtotal: 10000, discount: 1000, total_cost: 4000, delivery_fee: 600 };
  it("is goods paid minus goods cost, without the delivery fee", () => {
    expect(orderProfit({ ...base, status: "delivered" })).toBe(5000);
  });
  it("only counts delivered orders in sales and profit", () => {
    const s = summarizeOrders([
      { ...base, status: "delivered" },
      { ...base, status: "cancelled" },
      { ...base, status: "returned" },
      { ...base, status: "pending" },
    ]);
    expect(s.revenue).toBe(9000);
    expect(s.profit).toBe(5000);
    expect(s.pending).toBe(1);
    expect(s.count).toBe(4);
  });
});
