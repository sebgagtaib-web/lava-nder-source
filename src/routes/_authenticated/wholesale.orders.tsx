import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { WholesaleLayout } from "@/components/store/WholesaleLayout";
import { StatusBadge, type OrderStatus } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatDZD, formatDate } from "@/lib/format";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/wholesale/orders")({
  head: () => ({
    meta: [
      { title: "طلباتي — Lava Nder لافاندر" },
      { name: "description", content: "تابع حالة طلبات الجملة الخاصة بك." },
      { property: "og:title", content: "طلباتي — Lava Nder لافاندر" },
      { property: "og:description", content: "تابع حالة طلبات الجملة الخاصة بك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <WholesaleLayout>
      <MyOrders />
    </WholesaleLayout>
  ),
});

function MyOrders() {
  const { t, lang } = useI18n();
  const me = useMe();
  const userId = me.data?.userId;
  const q = useQuery({
    queryKey: ["my-orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, delivery_fee, wilaya_name, created_at, order_items(id, product_name, quantity, unit_price, color, size)")
        .eq("merchant_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="font-display text-5xl">{t("ws.orders")}</h1>
      {q.isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !q.data?.length ? (
        <p className="py-24 text-center text-muted-foreground">{t("ws.noOrders")}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {q.data.map((o) => (
            <li key={o.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl">{t("ws.orderNo")} {o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.created_at, lang)} · {o.wilaya_name}</p>
                </div>
                <StatusBadge status={o.status as OrderStatus} label={t(`status.${o.status}`)} />
              </div>
              <ul className="mt-4 space-y-1 text-sm">
                {o.order_items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>{i.product_name} {[i.color, i.size].filter(Boolean).length > 0 && <span className="text-muted-foreground">({[i.color, i.size].filter(Boolean).join(" · ")})</span>} × {i.quantity}</span>
                    <span className="text-muted-foreground">{formatDZD(Number(i.unit_price) * i.quantity, lang)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">{t("cart.total")}</span>
                <span className="font-semibold text-primary">{formatDZD(o.total, lang)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
