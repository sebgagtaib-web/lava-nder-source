import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WholesaleLayout } from "@/components/store/WholesaleLayout";
import { QtyStepper } from "@/components/store/QtyStepper";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { formatDZD } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/wholesale/catalog")({
  head: () => ({
    meta: [
      { title: "كتالوج الجملة — Lava Nder لافاندر" },
      { name: "description", content: "قطع جبسية خام بأسعار الجملة للتجار." },
      { property: "og:title", content: "كتالوج الجملة — Lava Nder لافاندر" },
      { property: "og:description", content: "قطع جبسية خام بأسعار الجملة للتجار." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <WholesaleLayout>
      <Catalog />
    </WholesaleLayout>
  ),
});

type WsProduct = {
  id: string;
  name_ar: string;
  name_fr: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  price: number;
  min_quantity: number;
  images: string[];
  colors: string[];
  sizes: string[];
  material: string | null;
};

function Catalog() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ["wholesale-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name_ar, name_fr, name_en, description_ar, description_fr, description_en, price, min_quantity, images, colors, sizes, material")
        .eq("channel", "wholesale")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WsProduct[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="font-display text-5xl">{t("ws.catalog")}</h1>
      <p className="mt-2 text-muted-foreground">{t("ws.catalogSubtitle")}</p>
      {q.isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !q.data?.length ? (
        <p className="py-24 text-center text-muted-foreground">{t("ws.catalogEmpty")}</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((p) => <WsCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function WsCard({ p }: { p: WsProduct }) {
  const { t, pick, lang } = useI18n();
  const cart = useCart();
  const [qty, setQty] = useState(p.min_quantity);
  const [color, setColor] = useState<string | undefined>(p.colors[0]);
  const [size, setSize] = useState<string | undefined>(p.sizes[0]);
  const chip = (sel: boolean) =>
    cn("rounded-full border px-3 py-1 text-xs transition-all", sel ? "border-primary bg-accent text-primary" : "border-border hover:border-primary/40");

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className="aspect-[4/3] bg-sand">
        {p.images[0] && <img src={p.images[0]} alt={pick(p, "name")} loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="font-display text-2xl">{pick(p, "name")}</h2>
          {pick(p, "description") && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pick(p, "description")}</p>}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-semibold text-primary">
            {formatDZD(p.price, lang)} <span className="text-xs font-normal text-muted-foreground">/ {t("ws.perPiece")}</span>
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{t("ws.minQty", { n: p.min_quantity })}</span>
        </div>
        {p.colors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.colors.map((c) => <button key={c} type="button" className={chip(color === c)} onClick={() => setColor(c)}>{c}</button>)}
          </div>
        )}
        {p.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.sizes.map((s) => <button key={s} type="button" className={chip(size === s)} onClick={() => setSize(s)}>{s}</button>)}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <QtyStepper value={qty} onChange={setQty} min={p.min_quantity} />
          <Button
            variant="hero"
            size="sm"
            onClick={() => {
              cart.add("wholesale", {
                productId: p.id,
                name: { ar: p.name_ar, fr: p.name_fr, en: p.name_en },
                image: p.images[0],
                price: Number(p.price),
                quantity: qty,
                minQuantity: p.min_quantity,
                color,
                size,
              });
              toast.success(t("ws.added"));
            }}
          >
            <ShoppingBag /> {t("ws.addToCart")}
          </Button>
        </div>
      </div>
    </article>
  );
}
