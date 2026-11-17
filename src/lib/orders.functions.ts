import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeTotals, deliveryFee, type DeliveryType } from "@/lib/pricing";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10000),
  color: z.string().trim().max(60).optional(),
  size: z.string().trim().max(60).optional(),
  inBundle: z.boolean().optional(),
});

const phoneRegex = /^(?:\+213|0)\d{8,9}$/;

const shippingSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z
    .string()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(phoneRegex)),
  wilayaCode: z.number().int().min(1).max(99),
  commune: z.string().trim().min(2).max(120),
  address: z.string().trim().max(300).optional(),
  deliveryType: z.enum(["office", "home"]),
  notes: z.string().trim().max(500).optional(),
});

const orderSchema = shippingSchema.extend({ items: z.array(itemSchema).min(1).max(60) });
export type OrderInput = z.input<typeof orderSchema>;

async function createOrder(channel: "retail" | "wholesale", input: z.output<typeof orderSchema>, merchantId: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const ids = [...new Set(input.items.map((i) => i.productId))];
  const { data: products, error: pErr } = await supabaseAdmin
    .from("products")
    .select("id, channel, name_ar, price, min_quantity, images, is_active, is_bundle_eligible, product_costs(cost_price)")
    .in("id", ids);
  if (pErr) throw new Error(pErr.message);

  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  // Merge identical lines so minimum quantities are checked on the total per product.
  const qtyPerProduct = new Map<string, number>();
  for (const i of input.items) qtyPerProduct.set(i.productId, (qtyPerProduct.get(i.productId) ?? 0) + i.quantity);

  for (const [pid, qty] of qtyPerProduct) {
    const p = byId.get(pid);
    if (!p || !p.is_active || p.channel !== channel) throw new Error("PRODUCT_UNAVAILABLE");
    if (channel === "wholesale" && qty < p.min_quantity) throw new Error(`MIN_QTY:${p.name_ar}:${p.min_quantity}`);
  }

  const { data: rate } = await supabaseAdmin
    .from("delivery_rates")
    .select("name_ar, office_price, home_price, office_enabled, home_enabled")
    .eq("wilaya_code", input.wilayaCode)
    .maybeSingle();
  const fee = deliveryFee(
    rate ? { ...rate, office_price: Number(rate.office_price), home_price: Number(rate.home_price) } : null,
    input.deliveryType as DeliveryType,
  );
  if (fee === null) throw new Error("DELIVERY_UNAVAILABLE");

  let rule: { minItems: number; percent: number } | undefined;
  if (channel === "retail") {
    const { data: s } = await supabaseAdmin.from("store_settings").select("bundle_min_items, bundle_discount_percent").eq("id", 1).maybeSingle();
    if (s) rule = { minItems: s.bundle_min_items, percent: Number(s.bundle_discount_percent) };
  }

  const lines = input.items.map((i) => {
    const p = byId.get(i.productId)!;
    const pc = p.product_costs as unknown as { cost_price: number } | { cost_price: number }[] | null;
    const cost = Array.isArray(pc) ? Number(pc[0]?.cost_price ?? 0) : Number(pc?.cost_price ?? 0);
    return {
      product: p,
      cost,
      unitPrice: Number(p.price),
      quantity: i.quantity,
      inBundle: channel === "retail" && !!i.inBundle && p.is_bundle_eligible,
      color: i.color || null,
      size: i.size || null,
    };
  });

  const totals = computeTotals(lines, fee, rule);
  const totalCost = Math.round(lines.reduce((s, l) => s + l.cost * l.quantity, 0));

  const { data: order, error: oErr } = await supabaseAdmin
    .from("orders")
    .insert({
      channel,
      merchant_id: merchantId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      wilaya_code: input.wilayaCode,
      wilaya_name: rate!.name_ar,
      commune: input.commune,
      address: input.address || null,
      delivery_type: input.deliveryType,
      delivery_fee: totals.delivery,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      total_cost: totalCost,
      notes: input.notes || null,
    })
    .select("id, order_number")
    .single();
  if (oErr || !order) throw new Error(oErr?.message ?? "ORDER_FAILED");

  const { error: iErr } = await supabaseAdmin.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      product_name: l.product.name_ar,
      image: l.product.images?.[0] ?? null,
      unit_price: l.unitPrice,
      unit_cost: l.cost,
      quantity: l.quantity,
      color: l.color,
      size: l.size,
      in_bundle: l.inBundle,
    })),
  );
  if (iErr) {
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    throw new Error(iErr.message);
  }

  return { orderNumber: order.order_number, total: totals.total };
}

export const placeRetailOrder = createServerFn({ method: "POST" })
  .inputValidator((input: OrderInput) => orderSchema.parse(input))
  .handler(async ({ data }) => createOrder("retail", data, null));

export const placeWholesaleOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: OrderInput) => orderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isMerchant } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "merchant" });
    if (!isMerchant) throw new Error("FORBIDDEN");
    const { data: profile } = await context.supabase.from("profiles").select("is_active").eq("id", context.userId).maybeSingle();
    if (!profile?.is_active) throw new Error("ACCOUNT_INACTIVE");
    return createOrder("wholesale", data, context.userId);
  });
