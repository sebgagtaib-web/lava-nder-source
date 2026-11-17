import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Coins, PackageCheck, ShoppingBag, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Spinner } from "@/components/admin/AdminLayout";
import { CHANNEL_AR, STATUS_AR, dateAr, dzd } from "@/components/admin/labels";
import { StatusBadge, type OrderStatus } from "@/components/StatusBadge";
import { summarizeOrders } from "@/lib/pricing";
import { inPeriod, monthlySeries, type Period } from "@/lib/reports";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "نظرة عامة — لوحة المالك" }] }),
  component: Dashboard,
});

const PERIODS: { id: Period; label: string }[] = [
  { id: "month", label: "هذا الشهر" },
  { id: "30d", label: "آخر 30 يوماً" },
  { id: "year", label: "هذه السنة" },
  { id: "all", label: "منذ البداية" },
];

const MONTHS = ["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function Dashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const orders = useQuery({
    queryKey: ["admin", "orders-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, channel, status, subtotal, discount, total, total_cost, delivery_fee, customer_name, wilaya_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data;
    },
  });
  const lowStock = useQuery({
    queryKey: ["admin", "low-stock"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name_ar, stock, channel").not("stock", "is", null).lte("stock", 3).eq("is_active", true).limit(8);
      return data ?? [];
    },
  });

  const view = useMemo(() => {
    const rows = orders.data ?? [];
    const scoped = inPeriod(rows, period);
    return {
      all: summarizeOrders(scoped),
      retail: summarizeOrders(scoped.filter((o) => o.channel === "retail")),
      wholesale: summarizeOrders(scoped.filter((o) => o.channel === "wholesale")),
      series: monthlySeries(rows, 6).map((m) => ({ ...m, name: MONTHS[m.month] })),
      pending: rows.filter((o) => o.status === "pending").slice(0, 6),
    };
  }, [orders.data, period]);

  if (orders.isLoading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="أهلاً بك"
        subtitle="المداخيل والأرباح تُحسب من الطلبات المسلَّمة فقط، دون مصاريف التوصيل."
        actions={
          <div className="flex rounded-full border border-border bg-card p-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn("rounded-full px-3 py-1.5 text-xs transition-colors", period === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Coins} label="المداخيل" value={dzd(view.all.revenue)} tone="primary" />
        <Stat icon={TrendingUp} label="الربح الصافي" value={dzd(view.all.profit)} tone="success" />
        <Stat icon={ShoppingBag} label="كل الطلبات" value={String(view.all.count)} hint={`${view.all.pending} جديد · ${view.all.inProgress} قيد المعالجة`} />
        <Stat icon={PackageCheck} label="طلبات مسلَّمة" value={String(view.all.delivered)} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {(["retail", "wholesale"] as const).map((c) => (
          <Panel key={c}>
            <p className="text-sm text-muted-foreground">{c === "retail" ? "متجر الزبائن" : "متجر التجار (الجملة)"}</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">المداخيل</p><p className="mt-1 font-semibold">{dzd(view[c].revenue)}</p></div>
              <div><p className="text-xs text-muted-foreground">الربح</p><p className="mt-1 font-semibold text-success">{dzd(view[c].profit)}</p></div>
              <div><p className="text-xs text-muted-foreground">الطلبات</p><p className="mt-1 font-semibold">{view[c].count}</p></div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="mt-4">
        <p className="mb-4 font-display text-2xl">آخر 6 أشهر</p>
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.series}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={60} tickFormatter={(v: number) => new Intl.NumberFormat("fr-DZ", { notation: "compact" }).format(v)} />
              <Tooltip formatter={(v: number, n: string) => [dzd(v), n === "revenue" ? "المداخيل" : "الربح"]} contentStyle={{ borderRadius: 16, direction: "rtl" }} />
              <Bar dataKey="revenue" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="profit" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-chart-2" /> المداخيل</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-chart-1" /> الربح</span>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-2xl">طلبات جديدة تنتظر التأكيد</p>
            <Link to="/admin/orders" className="flex items-center gap-1 text-sm text-primary hover:underline">الكل <ArrowLeft className="h-4 w-4" /></Link>
          </div>
          {view.pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد طلبات جديدة 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {view.pending.map((o) => (
                <li key={o.id}>
                  <Link to="/admin/orders" search={{ open: o.id }} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                    <div>
                      <p className="font-medium">#{o.order_number} · {o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{CHANNEL_AR[o.channel]} · {o.wilaya_name} · {dateAr(o.created_at)}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-semibold">{dzd(o.total)}</p>
                      <StatusBadge status={o.status as OrderStatus} label={STATUS_AR[o.status as OrderStatus]} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <p className="mb-3 font-display text-2xl">مخزون منخفض</p>
          {!lowStock.data?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">كل المنتجات متوفرة</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.data.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span>{p.name_ar} <span className="text-xs text-muted-foreground">({CHANNEL_AR[p.channel]})</span></span>
                  <span className={cn("font-semibold", (p.stock ?? 0) === 0 ? "text-destructive" : "text-warning-foreground")}>{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, hint, tone }: { icon: typeof Coins; label: string; value: string; hint?: string; tone?: "primary" | "success" }) {
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", tone === "success" ? "bg-success/15 text-success" : "bg-accent text-primary")}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Panel>
  );
}
