import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Hand, ShoppingBag, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StoreLayout } from "@/components/store/StoreLayout";
import { QtyStepper } from "@/components/store/QtyStepper";
import { getRetailProduct } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { formatDZD } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const res = await getRetailProduct({ data: { id: params.id } });
    if (!res.product) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "منتج غير متوفر — Lava Nder لافاندر" }, { name: "robots", content: "noindex" }] };
    const title = `${p.name_ar} — Lava Nder لافاندر`;
    const desc = (p.description_ar ?? "ديكور جبسي مصنوع يدوياً").slice(0, 155);
    const img = p.images?.[0];
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (img?.startsWith("https://")) meta.push({ property: "og:image", content: img }, { name: "twitter:image", content: img });
    return { meta };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  const { t } = useI18n();
  return (
    <StoreLayout>
      <div className="py-32 text-center">
        <h1 className="font-display text-4xl">{t("product.notFound")}</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/shop">{t("product.back")}</Link>
        </Button>
      </div>
    </StoreLayout>
  );
}

function ProductPage() {
  const { product, category } = Route.useLoaderData();
  const { t, pick, lang } = useI18n();
  const cart = useCart();
  const p = product!;
  const [imgIdx, setImgIdx] = useState(0);
  const [color, setColor] = useState<string | undefined>(p.colors[0]);
  const [size, setSize] = useState<string | undefined>(p.sizes[0]);
  const [qty, setQty] = useState(1);

  const addToCart = () => {
    cart.add("retail", {
      productId: p.id,
      name: { ar: p.name_ar, fr: p.name_fr, en: p.name_en },
      image: p.images[0],
      price: Number(p.price),
      quantity: qty,
      minQuantity: 1,
      color,
      size,
    });
    toast.success(t("product.added"));
  };

  const chip = (sel: boolean) =>
    cn("rounded-full border px-4 py-2 text-sm transition-all", sel ? "border-primary bg-accent text-primary ring-1 ring-primary" : "border-border bg-card hover:border-primary/40");

  return (
    <StoreLayout>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-2 md:py-16">
        <div>
          <div className="overflow-hidden arch bg-sand shadow-lift">
            {p.images[imgIdx] && <img src={p.images[imgIdx]} alt={pick(p, "name")} className="aspect-[4/5] w-full object-cover" />}
          </div>
          {p.images.length > 1 && (
            <div className="mt-4 flex justify-center gap-3">
              {p.images.map((src, i) => (
                <button key={src} onClick={() => setImgIdx(i)} className={cn("h-20 w-16 overflow-hidden arch border-2", i === imgIdx ? "border-primary" : "border-transparent opacity-70")}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:pt-8">
          {category && (
            <Link to="/shop" search={{ category: category.slug }} className="text-sm text-primary hover:underline">
              {pick(category, "name")}
            </Link>
          )}
          <h1 className="mt-2 font-display text-5xl leading-tight">{pick(p, "name")}</h1>
          <p className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-4xl text-primary">{formatDZD(p.price, lang)}</span>
            {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
              <span className="text-lg text-muted-foreground line-through">{formatDZD(p.compare_at_price, lang)}</span>
            )}
          </p>
          {pick(p, "description") && <p className="mt-6 leading-relaxed text-muted-foreground">{pick(p, "description")}</p>}

          {p.colors.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium">{t("product.color")}</p>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={chip(color === c)}>{c}</button>
                ))}
              </div>
            </div>
          )}
          {p.sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">{t("product.size")}</p>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={chip(size === s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QtyStepper value={qty} onChange={setQty} />
            <Button variant="hero" size="lg" className="flex-1" onClick={addToCart}>
              <ShoppingBag /> {t("product.addToCart")}
            </Button>
          </div>

          <ul className="mt-10 space-y-3 rounded-3xl bg-secondary/60 p-6 text-sm">
            {p.material && (
              <li className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("product.material")}</span>
                <span className="font-medium">{p.material}</span>
              </li>
            )}
            <li className="flex items-center gap-2"><Hand className="h-4 w-4 text-primary" /> {t("product.handmade")}</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> {t("home.story.p3")}</li>
            <li className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> {t("product.cod")}</li>
          </ul>
        </div>
      </div>
    </StoreLayout>
  );
}
