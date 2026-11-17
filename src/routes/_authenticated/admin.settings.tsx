import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Spinner } from "@/components/admin/AdminLayout";
import { errorText } from "@/components/admin/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — لوحة المالك" }] }),
  component: SettingsPage,
});

const EMPTY = {
  store_name: "",
  tagline: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  bundle_min_items: "3",
  bundle_discount_percent: "10",
  default_wholesale_min_qty: "10",
};

function SettingsPage() {
  const router = useRouter();
  const [f, setF] = useState(EMPTY);
  const s = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (s.data)
      setF({
        store_name: s.data.store_name,
        tagline: s.data.tagline ?? "",
        phone: s.data.phone ?? "",
        whatsapp: s.data.whatsapp ?? "",
        instagram: s.data.instagram ?? "",
        facebook: s.data.facebook ?? "",
        bundle_min_items: String(s.data.bundle_min_items),
        bundle_discount_percent: String(s.data.bundle_discount_percent),
        default_wholesale_min_qty: String(s.data.default_wholesale_min_qty),
      });
  }, [s.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("store_settings")
        .update({
          store_name: f.store_name.trim() || "Lava Nder",
          tagline: f.tagline.trim() || null,
          phone: f.phone.trim() || null,
          whatsapp: f.whatsapp.trim() || null,
          instagram: f.instagram.trim() || null,
          facebook: f.facebook.trim() || null,
          bundle_min_items: Math.max(2, Math.round(Number(f.bundle_min_items) || 3)),
          bundle_discount_percent: Math.min(90, Math.max(0, Number(f.bundle_discount_percent) || 0)),
          default_wholesale_min_qty: Math.max(1, Math.round(Number(f.default_wholesale_min_qty) || 1)),
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات");
      router.invalidate();
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (s.isLoading) return <Spinner />;

  const field = (k: keyof typeof EMPTY, label: string, opts: { type?: string; ltr?: boolean; hint?: string } = {}) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={opts.type ?? "text"} dir={opts.ltr ? "ltr" : undefined} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      {opts.hint && <p className="text-xs text-muted-foreground">{opts.hint}</p>}
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
      <PageHeader
        title="الإعدادات"
        actions={<Button type="submit" variant="hero" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} حفظ</Button>}
      />
      <Panel className="space-y-4">
        <p className="font-display text-2xl">المتجر</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("store_name", "اسم المتجر")}
          {field("tagline", "الشعار القصير")}
        </div>
      </Panel>
      <Panel className="space-y-4">
        <p className="font-display text-2xl">التواصل</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("phone", "رقم الهاتف", { type: "tel", ltr: true })}
          {field("whatsapp", "رقم الواتساب", { type: "tel", ltr: true, hint: "مثال: 0550123456" })}
          {field("instagram", "رابط إنستغرام", { ltr: true })}
          {field("facebook", "رابط فيسبوك", { ltr: true })}
        </div>
      </Panel>
      <Panel className="space-y-4">
        <p className="font-display text-2xl">التجميعة (متجر الزبائن)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("bundle_min_items", "أقل عدد قطع للحصول على الخصم", { type: "number" })}
          {field("bundle_discount_percent", "نسبة الخصم %", { type: "number" })}
        </div>
      </Panel>
      <Panel className="space-y-4">
        <p className="font-display text-2xl">الجملة (متجر التجار)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("default_wholesale_min_qty", "أقل كمية افتراضية للمنتجات الجديدة", { type: "number", hint: "يمكنك تغييرها لكل منتج على حدة." })}
        </div>
      </Panel>
    </form>
  );
}
