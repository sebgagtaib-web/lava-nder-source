import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Spinner } from "@/components/admin/AdminLayout";
import { ProductForm, type AdminProduct } from "@/components/admin/ProductForm";
import { dzd, errorText } from "@/components/admin/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "المنتجات — لوحة المالك" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const qc = useQueryClient();
  const [channel, setChannel] = useState<"retail" | "wholesale">("retail");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);

  const data = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const [prods, cats, settings] = await Promise.all([
        supabase.from("products").select("*, product_costs(cost_price)").order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name_ar").order("sort_order"),
        supabase.from("store_settings").select("default_wholesale_min_qty").eq("id", 1).maybeSingle(),
      ]);
      if (prods.error) throw prods.error;
      return {
        products: prods.data as unknown as AdminProduct[],
        categories: cats.data ?? [],
        defaultMinQty: settings.data?.default_wholesale_min_qty ?? 10,
      };
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e) => toast.error(errorText(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف المنتج");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data.data?.products ?? []).filter(
      (p) => p.channel === channel && (!term || [p.name_ar, p.name_fr, p.name_en].some((n) => n?.toLowerCase().includes(term))),
    );
  }, [data.data, channel, q]);
  const catName = (id: string | null) => data.data?.categories.find((c) => c.id === id)?.name_ar;

  if (data.isLoading) return <Spinner />;

  if (editing) {
    return (
      <ProductForm
        key={editing === "new" ? "new" : editing.id}
        product={editing === "new" ? null : editing}
        channel={channel}
        categories={data.data?.categories ?? []}
        defaultMinQty={data.data?.defaultMinQty ?? 10}
        onDone={() => setEditing(null)}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="المنتجات"
        subtitle="أضف منتجاتك وعدّلها، وحدّد في أي متجر تظهر."
        actions={<Button variant="hero" onClick={() => setEditing("new")}><Plus /> منتج جديد</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-border bg-card p-1">
          {(["retail", "wholesale"] as const).map((c) => (
            <button key={c} onClick={() => setChannel(c)} className={cn("rounded-full px-4 py-1.5 text-sm", channel === c ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {c === "retail" ? "متجر الزبائن" : "متجر التجار"} ({(data.data?.products ?? []).filter((p) => p.channel === c).length})
            </button>
          ))}
        </div>
        <div className="relative min-w-56 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث عن منتج" className="rounded-full bg-card ps-9" />
        </div>
      </div>

      {rows.length === 0 ? (
        <Panel>
          <p className="py-12 text-center text-muted-foreground">لا توجد منتجات هنا بعد.</p>
        </Panel>
      ) : (
        <Panel className="p-0">
          <ul className="divide-y divide-border">
            {rows.map((p) => {
              const cost = Number(p.product_costs?.cost_price ?? 0);
              return (
                <li key={p.id} className={cn("flex flex-wrap items-center gap-4 px-5 py-4", !p.is_active && "opacity-60")}>
                  {p.images[0] ? <img src={p.images[0]} alt="" className="h-16 w-14 rounded-2xl object-cover" /> : <span className="h-16 w-14 rounded-2xl bg-sand" />}
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{p.name_ar}</p>
                    <p className="text-xs text-muted-foreground">
                      {[catName(p.category_id), p.material, p.channel === "wholesale" ? `أقل كمية ${p.min_quantity}` : null, p.stock != null ? `المخزون ${p.stock}` : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="w-36 text-sm">
                    <p className="font-semibold">{dzd(p.price)}</p>
                    <p className="text-xs text-muted-foreground">التكلفة {dzd(cost)} · <span className="text-success">ربح {dzd(Number(p.price) - cost)}</span></p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={p.is_active} onCheckedChange={(v) => toggle.mutate({ id: p.id, is_active: v })} />
                    {p.is_active ? "ظاهر" : "مخفي"}
                  </label>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => setEditing(p)}><Pencil /></Button>
                    <Button size="icon" variant="ghost" aria-label="حذف" className="text-destructive" onClick={() => setToDelete(p)}><Trash2 /></Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle>حذف «{toDelete?.name_ar}»؟</AlertDialogTitle>
            <AlertDialogDescription>سيختفي المنتج نهائياً. الطلبات القديمة تبقى محفوظة. إن أردت إخفاءه مؤقتاً فقط، استعمل زر «ظاهر».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => toDelete && remove.mutate(toDelete.id)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
