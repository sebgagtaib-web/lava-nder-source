import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { getCatalog } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ShopSearch = { category?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),
  loader: () => getCatalog(),
  head: () => ({
    meta: [
      { title: "المتجر — Lava Nder لافاندر" },
      { name: "description", content: "تصفحي كل ديكوراتنا الجبسية المصنوعة يدوياً: مزهريات، شمعدانات، ديكور جداري ومنحوتات." },
      { property: "og:title", content: "المتجر — Lava Nder لافاندر" },
      { property: "og:description", content: "ديكورات جبسية مصنوعة يدوياً مع توصيل لكل الولايات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { categories, products } = Route.useLoaderData();
  const { category } = Route.useSearch();
  const { t, pick } = useI18n();
  const active = categories.find((c) => c.slug === category);
  const list = active ? products.filter((p) => p.category_id === active.id) : products;

  const chip = (selected: boolean) =>
    cn(
      "rounded-full border px-5 py-2 text-sm transition-colors",
      selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
    );

  return (
    <StoreLayout>
      <section className="bg-gradient-blush">
        <div className="mx-auto max-w-7xl px-6 py-14 text-center">
          <h1 className="font-display text-5xl sm:text-6xl">{active ? pick(active, "name") : t("shop.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("shop.subtitle")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link to="/shop" search={{}} className={chip(!active)}>
              {t("shop.all")}
            </Link>
            {categories.map((c) => (
              <Link key={c.id} to="/shop" search={{ category: c.slug }} className={chip(active?.id === c.id)}>
                {pick(c, "name")}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pt-12">
        {list.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">{t("shop.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
