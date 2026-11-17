import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Spinner } from "@/components/admin/AdminLayout";
import { CHANNEL_AR, DELIVERY_AR, STATUS_AR, dateAr, dzd, errorText } from "@/components/admin/labels";
import { ORDER_STATUSES, StatusBadge, type OrderStatus } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { orderProfit } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  validateSearch: (s: Record<string, unknown>): { open?: string } => (typeof s["open"] === "string" ? { open: s["open"] } : {}),
  head: () => ({ meta: [{ title: "الطلبات — لوحة المالك" }] }),
  component: OrdersPage,
});

type Channel = "all" | "retail" | "wholesale";

function OrdersPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/orders" });
  const [channel, setChannel] = useState<Channel>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [q, setQ] = useState("");

  const orders = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, channel, status, customer_name, customer_phone, wilaya_name, commune, total, delivery_type, created_at, profiles(business_name)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (orders.data ?? []).filter(
      (o) =>
        (channel === "all" || o.channel === channel) &&
        (status === "all" || o.status === status) &&
        (!term || o.customer_name.toLowerCase().includes(term) || o.customer_phone.includes(term) || String(o.order_number) === term.replace("#", "")),
    );
  }, [orders.data, channel, status, q]);

  const setOpen = (id: string | undefined) => navigate({ search: id ? { open: id } : {}, replace: true });

  return (
    <>
      <PageHeader title="الطلبات" subtitle="طلبات متجر الزبائن ومتجر التجار في مكان واحد." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-border bg-card p-1">
          {(["all", "retail", "wholesale"] as const).map((c) => (
            <button key={c} onClick={() => setChannel(c)} className={cn("rounded-full px-4 py-1.5 text-sm", channel === c ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {c === "all" ? "الكل" : CHANNEL_AR[c]}
            </button>
          ))}
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-44 rounded-full bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_AR[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative min-w-56 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو رقم الطلب" className="rounded-full bg-card ps-9" />
        </div>
      </div>

      {orders.isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Panel><p className="py-12 text-center text-muted-foreground">لا توجد طلبات</p></Panel>
      ) : (
        <Panel className="p-0">
          <ul className="divide-y divide-border">
            {rows.map((o) => (
              <li key={o.id}>
                <button onClick={() => setOpen(o.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-start hover:bg-muted/50">
                  <span className="w-16 font-display text-xl">#{o.order_number}</span>
                  <span className="min-w-40 flex-1">
                    <span className="block font-medium">{o.customer_name}{o.profiles?.business_name ? ` · ${o.profiles.business_name}` : ""}</span>
                    <span className="block text-xs text-muted-foreground">{o.wilaya_name} · {o.commune} · {DELIVERY_AR[o.delivery_type]} · {dateAr(o.created_at)}</span>
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs", o.channel === "wholesale" ? "bg-cocoa text-cocoa-foreground" : "bg-secondary")}>{CHANNEL_AR[o.channel]}</span>
                  <StatusBadge status={o.status as OrderStatus} label={STATUS_AR[o.status as OrderStatus]} />
                  <span className="w-28 text-end font-semibold">{dzd(o.total)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Sheet open={!!search.open} onOpenChange={(v) => !v && setOpen(undefined)}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg" dir="rtl">
          {search.open && <OrderDetail id={search.open} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function OrderDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const order = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), profiles(first_name, last_name, business_name, phone, email)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (order.data) {
      setStatus(order.data.status as OrderStatus);
      setNotes(order.data.admin_notes ?? "");
    }
  }, [order.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orders").update({ status, admin_notes: notes || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ الطلب");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (order.isLoading) return <Spinner />;
  const o = order.data;
  if (!o) return <p className="py-20 text-center text-muted-foreground">الطلب غير موجود</p>;

  const phoneIntl = o.customer_phone.replace(/^0/, "213").replace(/^\+/, "");
  const profit = orderProfit(o);

  return (
    <div className="space-y-6 pb-10">
      <SheetHeader className="text-start">
        <SheetTitle className="font-display text-3xl">طلب #{o.order_number}</SheetTitle>
        <p className="text-sm text-muted-foreground">{CHANNEL_AR[o.channel]} · {dateAr(o.created_at)}</p>
      </SheetHeader>

      <section className="space-y-1 rounded-2xl bg-muted/60 p-4 text-sm">
        <p className="font-medium">{o.customer_name}</p>
        {o.profiles && <p className="text-muted-foreground">التاجر: {o.profiles.first_name} {o.profiles.last_name}{o.profiles.business_name ? ` (${o.profiles.business_name})` : ""}</p>}
        <p dir="ltr" className="text-end">{o.customer_phone}</p>
        <p>{o.wilaya_name} — {o.commune}</p>
        {o.address && <p className="text-muted-foreground">{o.address}</p>}
        <p>التوصيل: {DELIVERY_AR[o.delivery_type]}</p>
        {o.notes && <p className="mt-2 rounded-xl bg-card p-2">ملاحظة الزبون: {o.notes}</p>}
        <div className="flex gap-2 pt-3">
          <Button asChild size="sm" variant="outline"><a href={`tel:${o.customer_phone}`}><Phone /> اتصال</a></Button>
          <Button asChild size="sm" variant="outline"><a href={`https://wa.me/${phoneIntl}`} target="_blank" rel="noreferrer"><MessageCircle /> واتساب</a></Button>
        </div>
      </section>

      <section>
        <p className="mb-2 font-medium">المنتجات</p>
        <ul className="space-y-3">
          {o.order_items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 text-sm">
              {i.image ? <img src={i.image} alt="" className="h-14 w-12 rounded-xl object-cover" /> : <span className="h-14 w-12 rounded-xl bg-sand" />}
              <div className="flex-1">
                <p>{i.product_name}{i.in_bundle && <span className="ms-2 rounded-full bg-accent px-2 text-[11px] text-primary">تجميعة</span>}</p>
                <p className="text-xs text-muted-foreground">{[i.color, i.size].filter(Boolean).join(" · ")} {i.quantity} × {dzd(i.unit_price)}</p>
              </div>
              <span className="font-medium">{dzd(Number(i.unit_price) * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <Row k="المنتجات" v={dzd(o.subtotal)} />
          {Number(o.discount) > 0 && <Row k="خصم التجميعة" v={`− ${dzd(o.discount)}`} />}
          <Row k="التوصيل" v={dzd(o.delivery_fee)} />
          <Row k="المجموع الذي يدفعه الزبون" v={dzd(o.total)} bold />
          <Row k="تكلفة الصنع" v={dzd(o.total_cost)} muted />
          <Row k="ربحك من هذا الطلب" v={dzd(profit)} success />
        </dl>
      </section>

      <section className="space-y-3">
        <div>
          <Label>حالة الطلب</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_AR[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>ملاحظات خاصة (لا يراها الزبون)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1.5" placeholder="مثلاً: رقم التتبع، موعد الاتصال..." />
        </div>
        <Button variant="hero" className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>حفظ</Button>
      </section>
    </div>
  );
}

function Row({ k, v, bold, muted, success }: { k: string; v: string; bold?: boolean; muted?: boolean; success?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "font-semibold", muted && "text-muted-foreground", success && "font-semibold text-success")}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
