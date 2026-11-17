import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Spinner } from "@/components/admin/AdminLayout";
import { errorText } from "@/components/admin/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/delivery")({
  head: () => ({ meta: [{ title: "أسعار التوصيل — لوحة المالك" }] }),
  component: DeliveryPage,
});

type Rate = {
  wilaya_code: number;
  name_ar: string;
  name_fr: string;
  office_price: number;
  home_price: number;
  office_enabled: boolean;
  home_enabled: boolean;
};

function DeliveryPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Rate[]>([]);
  const [bulk, setBulk] = useState({ office: "", home: "" });

  const rates = useQuery({
    queryKey: ["admin", "delivery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_rates").select("*").order("wilaya_code");
      if (error) throw error;
      return data.map((r) => ({ ...r, office_price: Number(r.office_price), home_price: Number(r.home_price) })) as Rate[];
    },
  });
  useEffect(() => {
    if (rates.data) setRows(rates.data);
  }, [rates.data]);

  const original = useMemo(() => new Map((rates.data ?? []).map((r) => [r.wilaya_code, r])), [rates.data]);
  const changed = rows.filter((r) => {
    const o = original.get(r.wilaya_code);
    return o && (o.office_price !== r.office_price || o.home_price !== r.home_price || o.office_enabled !== r.office_enabled || o.home_enabled !== r.home_enabled);
  });

  const update = (code: number, patch: Partial<Rate>) => setRows((rs) => rs.map((r) => (r.wilaya_code === code ? { ...r, ...patch } : r)));

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("delivery_rates").upsert(changed);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`تم حفظ أسعار ${changed.length} ولاية`);
      qc.invalidateQueries({ queryKey: ["admin", "delivery"] });
      router.invalidate();
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const visible = rows.filter((r) => {
    const t = q.trim().toLowerCase();
    return !t || r.name_ar.includes(t) || r.name_fr.toLowerCase().includes(t) || String(r.wilaya_code) === t;
  });

  function applyBulk() {
    setRows((rs) =>
      rs.map((r) => ({
        ...r,
        office_price: bulk.office !== "" ? Number(bulk.office) : r.office_price,
        home_price: bulk.home !== "" ? Number(bulk.home) : r.home_price,
      })),
    );
    toast("طُبِّق السعر على كل الولايات — لا تنسَ الحفظ");
  }

  if (rates.isLoading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="أسعار التوصيل"
        subtitle="سعر التوصيل لكل ولاية: إلى مكتب شركة التوصيل أو إلى باب المنزل. أوقف الخيار إن لم يكن متوفراً."
        actions={
          <Button variant="hero" disabled={!changed.length || save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="animate-spin" />} حفظ التغييرات {changed.length > 0 && `(${changed.length})`}
          </Button>
        }
      />

      <Panel className="mb-4">
        <p className="mb-3 text-sm font-medium">تطبيق سعر موحَّد على كل الولايات</p>
        <div className="flex flex-wrap items-center gap-3">
          <Input type="number" min={0} className="w-36" placeholder="للمكتب" value={bulk.office} onChange={(e) => setBulk({ ...bulk, office: e.target.value })} />
          <Input type="number" min={0} className="w-36" placeholder="للمنزل" value={bulk.home} onChange={(e) => setBulk({ ...bulk, home: e.target.value })} />
          <Button variant="outline" onClick={applyBulk} disabled={bulk.office === "" && bulk.home === ""}>تطبيق</Button>
        </div>
      </Panel>

      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن ولاية بالاسم أو الرقم" className="rounded-full bg-card ps-9" />
      </div>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الولاية</th>
              <th className="px-4 py-3 text-start font-medium">التوصيل للمكتب (د.ج)</th>
              <th className="px-4 py-3 text-start font-medium">التوصيل للمنزل (د.ج)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((r) => {
              const isChanged = changed.some((c) => c.wilaya_code === r.wilaya_code);
              return (
                <tr key={r.wilaya_code} className={cn(isChanged && "bg-accent/40")}>
                  <td className="px-4 py-2.5">
                    <span className="me-2 inline-block w-7 text-xs text-muted-foreground">{String(r.wilaya_code).padStart(2, "0")}</span>
                    {r.name_ar}
                  </td>
                  {(["office", "home"] as const).map((k) => (
                    <td key={k} className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min={0}
                          className="h-9 w-28"
                          disabled={!r[`${k}_enabled`]}
                          value={r[`${k}_price`]}
                          onChange={(e) => update(r.wilaya_code, { [`${k}_price`]: Number(e.target.value) || 0 })}
                        />
                        <Switch checked={r[`${k}_enabled`]} onCheckedChange={(v) => update(r.wilaya_code, { [`${k}_enabled`]: v })} aria-label="متوفر" />
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
