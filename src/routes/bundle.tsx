import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Gift, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StoreLayout } from "@/components/store/StoreLayout";
import { QtyStepper } from "@/components/store/QtyStepper";
import { getCatalog } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { formatDZD } from "@/lib/format";
import { bundleItemsMissing, computeTotals } from "@/lib/pricing";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bundle")({
  loader: () => getCatalog(),
  head: () => ({
    meta: [
      { title: "كوّني تجميعتك — Lava Nder لافاندر" },
      { name: "description", content: "اختاري قطعك الجبسية المفضلة ونسّقيها في تجميعة واحدة مع خصم خاص." },
      { property: "og:title", content: "كوّني تجميعتك — Lava Nder لافاندر" },
      { property: "og:description", content: "نسّقي تجميعة ديكور جبسية مميزة واحصلي على خصم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BundleBuilder,
});

type Pick = { productId: string; qty: number; color?: string | undefined; size?: string | undefined };

function BundleBuilder() {
  const { products, categories } = Route.useLoaderData();
  const settings = useStoreSettings();
  const { t, pick, lang } = useI18n();
  const cart = useCart();
  const navigate = useNavigate();
  const [cat, setCat] = useState<string | null>(null);
  const [set, setSet] = useState<Pick[]>([]);

  const eligible = products.filter((p) => p.is_bundle_eligible);
  const shown = cat ? eligible.filter((p) => p.category_id === cat) : eligible;
  const byId = new Map(products.map((p) => [p.id, p]));
  const rule = { minItems: settings.bundle_min_items, percent: Number(settings.bundle_discount_percent) };

  const lines = set.map((s) => ({ unitPrice: Number(byId.get(s.productId)!.price), quantity: s.qty, inBundle: true }));
  const missing = bundleItemsMissing(lines, rule);
  const totals = computeTotals(lines, 0, rule);
  const pieces = set.reduce((n, s) => n + s.qty, 0);

  const toggle = (id: string) => {
    const p = byId.get(id)!;
    setSet((s) => (s.some((x) => x.productId === id) ? s.filter((x) => x.productId !== id) : [...s, { productId: id, qty: 1, color: p.colors[0], size: p.sizes[0] }]));
  };
  const update = (id: string, patch: Partial<Pick>) => setSet((s) => s.map((x) => (x.productId === id ? { ...x, ...patch } : x)));

  const addSet = () => {
    for (const s of set) {
      const p = byId.get(s.productId)!;
      cart.add("retail", {
        productId: p.id,
        name: { ar: p.name_ar, fr: p.name_fr, en: p.name_en },
        image: p.images[0],
        price: Number(p.price),
        quantity: s.qty,
        minQuantity: 1,
        color: s.color,
        size: s.size,
        inBundle: true,
      });
    }
    toast.success(t("bundle.added"));
    navigate({ to: "/cart" });
  };

  return (
    <StoreLayout>
      <section className="bg-gradient-blush">
        <div className="mx-auto max-w-7xl px-6 py-14 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-1.5 text-sm text-primary">
            <Gift className="h-4 w-4" /> {t("home.bundle.body", { p: rule.percent, n: rule.minItems })}
          </p>
          <h1 className="mt-5 font-display text-5xl sm:text-6xl">{t("bundle.title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("bundle.subtitle")}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 pt-10 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-3xl">{t("bundle.pick")}</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCat(null)} className={cn("rounded-full border px-4 py-1.5 text-sm", !cat ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{t("shop.all")}</button>
              {categories.filter((c) => eligible.some((p) => p.category_id === c.id)).map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)} className={cn("rounded-full border px-4 py-1.5 text-sm", cat === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                  {pick(c, "name")}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {shown.map((p) => {
              const selected = set.some((s) => s.productId === p.id);
              return (
                <button key={p.id} onClick={() => toggle(p.id)} className="group text-start">
                  <div className={cn("relative overflow-hidden arch border-2 transition-all", selected ? "border-primary shadow-lift" : "border-transparent shadow-soft")}>
                    {p.images[0] && <img src={p.images[0]} alt={pick(p, "name")} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    <span className={cn("absolute bottom-3 start-1/2 flex h-10 w-10 -translate-x-1/2 rtl:translate-x-1/2 items-center justify-center rounded-full transition-all", selected ? "bg-primary text-primary-foreground" : "bg-card/90 text-primary")}>
                      {selected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </span>
                  </div>
                  <p className="mt-3 text-center font-display text-lg">{pick(p, "name")}</p>
                  <p className="text-center text-sm text-primary">{formatDZD(p.price, lang)}</p>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl">{t("bundle.yourSet")}</h2>
              <span className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">{pieces} {t("bundle.pieces")}</span>
            </div>

            {/* Shelf preview */}
            <div className="mt-5 rounded-2xl bg-gradient-sand p-4">
              <div className="flex min-h-32 items-end justify-center gap-2">
                {set.length === 0 ? (
                  <p className="self-center px-4 text-center text-sm text-muted-foreground">{t("bundle.emptySet")}</p>
                ) : (
                  set.slice(0, 6).map((s, i) => {
                    const p = byId.get(s.productId)!;
                    return (
                      <div key={s.productId} className={cn("overflow-hidden arch shadow-soft animate-rise-in", i % 2 ? "w-16" : "w-20")}>
                        {p.images[0] && <img src={p.images[0]} alt="" className="aspect-[3/4] w-full object-cover" />}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-1 h-2 rounded-full bg-primary/25" />
            </div>

            <div className="mt-5">
              <Progress value={Math.min(100, (pieces / rule.minItems) * 100)} className="h-2" />
              <p className={cn("mt-2 flex items-center gap-1.5 text-sm", missing === 0 ? "text-success font-medium" : "text-muted-foreground")}>
                <Sparkles className="h-4 w-4" />
                {missing === 0 ? t("bundle.unlocked", { p: rule.percent }) : t("bundle.hint", { n: missing, p: rule.percent })}
              </p>
            </div>

            {set.length > 0 && (
              <ul className="mt-5 max-h-72 space-y-3 overflow-auto pe-1">
                {set.map((s) => {
                  const p = byId.get(s.productId)!;
                  return (
                    <li key={s.productId} className="rounded-2xl border border-border p-3">
                      <div className="flex items-center gap-3">
                        {p.images[0] && <img src={p.images[0]} alt="" className="h-14 w-12 rounded-xl object-cover" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{pick(p, "name")}</p>
                          <p className="text-xs text-primary">{formatDZD(p.price, lang)}</p>
                        </div>
                        <QtyStepper value={s.qty} onChange={(n) => update(s.productId, { qty: n })} />
                        <button onClick={() => toggle(s.productId)} aria-label={t("cart.remove")} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {p.colors.length > 1 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {p.colors.map((c) => (
                            <button key={c} onClick={() => update(s.productId, { color: c })} className={cn("rounded-full border px-2.5 py-0.5 text-xs", s.color === c ? "border-primary bg-accent text-primary" : "border-border")}>
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.subtotal")}</span><span>{formatDZD(totals.subtotal, lang)}</span></div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-success"><span>{t("cart.discount")}</span><span>− {formatDZD(totals.discount, lang)}</span></div>
              )}
              <div className="flex justify-between pt-1"><span className="font-semibold">{t("cart.total")}</span><span className="font-display text-2xl text-primary">{formatDZD(totals.total, lang)}</span></div>
            </div>
            <Button variant="hero" size="lg" className="mt-5 w-full" disabled={set.length === 0} onClick={addSet}>
              {t("bundle.addSet")}
            </Button>
          </div>
        </aside>
      </div>
    </StoreLayout>
  );
}
