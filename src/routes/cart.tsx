import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreLayout } from "@/components/store/StoreLayout";
import { QtyStepper } from "@/components/store/QtyStepper";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { OrderSuccess } from "@/components/store/OrderSuccess";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { formatDZD } from "@/lib/format";
import { useStoreSettings } from "@/hooks/use-store-settings";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سلة المشتريات — Lava Nder لافاندر" },
      { name: "description", content: "راجعي طلبك وأكمليه بالدفع عند الاستلام." },
      { property: "og:title", content: "سلة المشتريات — Lava Nder لافاندر" },
      { property: "og:description", content: "أكملي طلبك مع التوصيل إلى المكتب أو المنزل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, pick, lang } = useI18n();
  const cart = useCart();
  const settings = useStoreSettings();
  const [mounted, setMounted] = useState(false);
  const [placed, setPlaced] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);
  const lines = mounted ? cart.lines("retail") : [];
  const rule = { minItems: settings.bundle_min_items, percent: Number(settings.bundle_discount_percent) };

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-6 py-12">
        {placed !== null ? (
          <OrderSuccess orderNumber={placed} backTo="/shop" />
        ) : (
          <>
            <h1 className="font-display text-5xl">{t("cart.title")}</h1>
            {mounted && lines.length === 0 ? (
              <div className="py-24 text-center">
                <span className="mx-auto flex h-20 w-20 items-center justify-center arch bg-accent text-primary">
                  <ShoppingBag className="h-8 w-8" />
                </span>
                <p className="mt-6 text-lg text-muted-foreground">{t("cart.empty")}</p>
                <Button asChild variant="hero" className="mt-6">
                  <Link to="/shop">{t("cart.continue")}</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_480px]">
                <ul className="space-y-4">
                  {lines.map((l) => (
                    <li key={l.key} className="flex gap-4 rounded-3xl border border-border bg-card p-4">
                      {l.image && <img src={l.image} alt="" className="h-28 w-24 rounded-2xl object-cover" />}
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-xl">{pick({ name_ar: l.name.ar, name_fr: l.name.fr, name_en: l.name.en }, "name")}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{[l.color, l.size].filter(Boolean).join(" · ")}</p>
                            {l.inBundle && <span className="mt-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">{t("cart.bundleTag")}</span>}
                          </div>
                          <button onClick={() => cart.remove("retail", l.key)} aria-label={t("cart.remove")} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <QtyStepper value={l.quantity} onChange={(n) => cart.setQty("retail", l.key, n)} />
                          <span className="font-semibold text-primary">{formatDZD(l.price * l.quantity, lang)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <CheckoutForm
                    channel="retail"
                    lines={lines}
                    rule={rule}
                    onPlaced={(n) => {
                      cart.clear("retail");
                      setPlaced(n);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </StoreLayout>
  );
}
