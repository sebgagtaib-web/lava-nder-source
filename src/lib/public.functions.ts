import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// Read-only public client (RLS as anon). Created per request inside handlers.
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const PRODUCT_COLUMNS =
  "id, name_ar, name_fr, name_en, description_ar, description_fr, description_en, category_id, price, compare_at_price, images, colors, sizes, material, stock, is_bundle_eligible, is_featured, created_at";

export const getStoreSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("store_settings")
    .select("store_name, tagline, phone, whatsapp, instagram, facebook, bundle_min_items, bundle_discount_percent")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (
    data ?? {
      store_name: "",
      tagline: null,
      phone: null,
      whatsapp: null,
      instagram: null,
      facebook: null,
      bundle_min_items: 3,
      bundle_discount_percent: 0,
    }
  );
});

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [cats, prods] = await Promise.all([
    sb.from("categories").select("id, name_ar, name_fr, name_en, slug, sort_order").order("sort_order"),
    sb.from("products").select(PRODUCT_COLUMNS).eq("channel", "retail").eq("is_active", true).order("created_at", { ascending: false }),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (prods.error) throw new Error(prods.error.message);
  return { categories: cats.data, products: prods.data };
});

export const getRetailProduct = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: product, error } = await sb
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("id", data.id)
      .eq("channel", "retail")
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    let category = null;
    if (product?.category_id) {
      const c = await sb.from("categories").select("id, name_ar, name_fr, name_en, slug").eq("id", product.category_id).maybeSingle();
      category = c.data;
    }
    return { product, category };
  });

export const getDeliveryRates = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("delivery_rates")
    .select("wilaya_code, name_ar, name_fr, office_price, home_price, office_enabled, home_enabled")
    .order("wilaya_code");
  if (error) throw new Error(error.message);
  return data;
});
