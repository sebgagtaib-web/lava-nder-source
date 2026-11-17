import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WholesaleLayout } from "@/components/store/WholesaleLayout";
import { QtyStepper } from "@/components/store/QtyStepper";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { OrderSuccess } from "@/components/store/OrderSuccess";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { formatDZD } from "@/lib/format";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/wholesale/cart")({
  head: () => ({
    meta: [
      { title: "سلة الجملة — Lava Nder لافاندر" },
      { name: "description", content: "راجع طلب الجملة وأكمله بالدفع عند الاستلام." },
      { property: "og:title", content: "سلة الجملة — Lava Nder لافاندر" },
      { property: "og:description", content: "راجع طلب الجملة وأكمله بالدفع عند الاستلام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <WholesaleLayout>
      <WsCart />
    </WholesaleLayout>
  ),
});

function WsCart() {
  const { t, pick, lang } = useI18n();
  const cart = useCart();
  const me = useMe();
  const [mounted, setMounted] = useState(false);
  const [placed, setPlaced] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);
  const lines = mounted ? cart.lines("wholesale") : [];
  const profile = me.data?.profile;

  if (placed !== null) return <div className="px-6 py-12"><OrderSuccess orderNumber={placed} backTo="/wholesale/catalog" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="font-display text-5xl">{t("ws.cart")}</h1>
      {mounted && lines.length === 0 ? (
        <div className="py-24 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center arch bg-accent text-primary"><ShoppingBag className="h-8 w-8" /></span>
          <p className="mt-6 text-lg text-muted-foreground">{t("ws.cartEmpty")}</p>
          <Button asChild variant="hero" className="mt-6"><Link to="/wholesale/catalog">{t("ws.openCatalog")}</Link></Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_480px]">
          <ul className="space-y-4">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4 rounded-3xl border border-border bg-card p-4">
                {l.image && <img src={l.image} alt="" className="h-24 w-24 rounded-2xl object-cover" />}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl">{pick({ name_ar: l.name.ar, name_fr: l.name.fr, name_en: l.name.en }, "name")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{[l.color, l.size].filter(Boolean).join(" · ")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t("ws.minQty", { n: l.minQuantity })}</p>
                    </div>
                    <button onClick={() => cart.remove("wholesale", l.key)} aria-label={t("cart.remove")} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QtyStepper value={l.quantity} min={l.minQuantity} onChange={(n) => cart.setQty("wholesale", l.key, n)} />
                    <span className="font-semibold text-primary">{formatDZD(l.price * l.quantity, lang)}</span>
                  </div>
                  {l.quantity < l.minQuantity && <p className="mt-2 text-xs text-destructive">{t("ws.minWarning", { n: l.minQuantity })}</p>}
                </div>
              </li>
            ))}
          </ul>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CheckoutForm
              key={profile ? "p" : "n"}
              channel="wholesale"
              lines={lines}
              {...(profile ? { defaults: { name: `${profile.first_name} ${profile.last_name}`, phone: profile.phone } } : {})}
              onPlaced={(n) => {
                cart.clear("wholesale");
                setPlaced(n);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
