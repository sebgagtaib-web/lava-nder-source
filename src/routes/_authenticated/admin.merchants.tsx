import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { KeyRound, Loader2, MessageCircle, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Spinner } from "@/components/admin/AdminLayout";
import { dateAr, dzd, errorText } from "@/components/admin/labels";
import { adminCreateMerchant, adminDeleteMerchant, adminResetMerchantPassword } from "@/lib/accounts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/merchants")({
  head: () => ({ meta: [{ title: "التجار — لوحة المالك" }] }),
  component: MerchantsPage,
});

type Merchant = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  business_name: string | null;
  is_active: boolean;
  created_at: string;
};

function MerchantsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [resetFor, setResetFor] = useState<Merchant | null>(null);
  const del = useServerFn(adminDeleteMerchant);

  const data = useQuery({
    queryKey: ["admin", "merchants"],
    queryFn: async () => {
      const { data: roles, error } = await supabase.from("user_roles").select("user_id").eq("role", "merchant");
      if (error) throw error;
      const ids = (roles ?? []).map((r) => r.user_id);
      if (!ids.length) return { merchants: [] as Merchant[], stats: new Map<string, { count: number; spent: number }>() };
      const [profiles, orders] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, phone, email, business_name, is_active, created_at").in("id", ids).order("created_at", { ascending: false }),
        supabase.from("orders").select("merchant_id, total, status").eq("channel", "wholesale"),
      ]);
      if (profiles.error) throw profiles.error;
      const stats = new Map<string, { count: number; spent: number }>();
      for (const o of orders.data ?? []) {
        if (!o.merchant_id) continue;
        const s = stats.get(o.merchant_id) ?? { count: 0, spent: 0 };
        s.count += 1;
        if (o.status === "delivered") s.spent += Number(o.total);
        stats.set(o.merchant_id, s);
      }
      return { merchants: profiles.data as Merchant[], stats };
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      toast.success(v.is_active ? "تم تفعيل الحساب" : "تم إيقاف الحساب — لن يستطيع الطلب");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => del({ data: { userId } }),
    onSuccess: () => {
      toast.success("تم حذف الحساب");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data.data?.merchants ?? []).filter(
      (m) => !term || `${m.first_name} ${m.last_name} ${m.business_name ?? ""} ${m.phone} ${m.email}`.toLowerCase().includes(term),
    );
  }, [data.data, q]);

  return (
    <>
      <PageHeader
        title="التجار"
        subtitle="حسابات أصحاب المشاريع الذين يشترون بالجملة."
        actions={<Button variant="hero" onClick={() => setAdding(true)}><Plus /> إضافة تاجر</Button>}
      />
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو البريد" className="rounded-full bg-card ps-9" />
      </div>

      {data.isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Panel><p className="py-12 text-center text-muted-foreground">لا يوجد تجار بعد.</p></Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((m) => {
            const s = data.data?.stats.get(m.id);
            const wa = m.phone.replace(/^0/, "213").replace(/^\+/, "");
            return (
              <Panel key={m.id} className={cn(!m.is_active && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.first_name} {m.last_name}</p>
                    {m.business_name && <p className="text-sm text-primary">{m.business_name}</p>}
                    <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{m.phone} · {m.email}</p>
                    <p className="text-xs text-muted-foreground">منذ {dateAr(m.created_at)}</p>
                  </div>
                  <label className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                    <Switch checked={m.is_active} onCheckedChange={(v) => toggle.mutate({ id: m.id, is_active: v })} />
                    {m.is_active ? "مفعَّل" : "موقوف"}
                  </label>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <p className="text-sm">{s?.count ?? 0} طلب · <span className="text-muted-foreground">مسلَّم {dzd(s?.spent ?? 0)}</span></p>
                  <div className="flex gap-1">
                    <Button asChild size="icon" variant="ghost" aria-label="واتساب"><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle /></a></Button>
                    <Button size="icon" variant="ghost" aria-label="كلمة مرور جديدة" onClick={() => setResetFor(m)}><KeyRound /></Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      aria-label="حذف"
                      onClick={() => { if (window.confirm(`حذف حساب ${m.first_name} ${m.last_name} نهائياً؟ طلباته القديمة تبقى محفوظة.`)) remove.mutate(m.id); }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <AddMerchantDialog open={adding} onOpenChange={setAdding} />
      <ResetPasswordDialog merchant={resetFor} onClose={() => setResetFor(null)} />
    </>
  );
}

function AddMerchantDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const create = useServerFn(adminCreateMerchant);
  const empty = { firstName: "", lastName: "", phone: "", email: "", password: "", businessName: "" };
  const [f, setF] = useState(empty);
  const m = useMutation({
    mutationFn: () => create({ data: f }),
    onSuccess: () => {
      toast.success("تم إنشاء حساب التاجر — أرسل له البريد وكلمة المرور");
      setF(empty);
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => {
      const msg = (e as Error).message;
      toast.error(msg.includes("EMAIL_TAKEN") ? errorText(e) : /phone|regex|invalid/i.test(msg) ? "تحقق من المعلومات: الهاتف (05/06/07…) والبريد وكلمة مرور من 8 أحرف على الأقل." : errorText(e));
    },
  });
  const fields: { k: keyof typeof empty; label: string; type?: string; ltr?: boolean; required?: boolean }[] = [
    { k: "firstName", label: "الاسم", required: true },
    { k: "lastName", label: "اللقب", required: true },
    { k: "phone", label: "رقم الهاتف", type: "tel", ltr: true, required: true },
    { k: "businessName", label: "اسم المحل / المشروع (اختياري)" },
    { k: "email", label: "البريد الإلكتروني", type: "email", ltr: true, required: true },
    { k: "password", label: "كلمة المرور (8 أحرف على الأقل)", ltr: true, required: true },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader className="text-start"><DialogTitle className="font-display text-3xl">تاجر جديد</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="grid gap-3 sm:grid-cols-2">
          {fields.map((x) => (
            <div key={x.k} className={x.k === "email" || x.k === "password" || x.k === "businessName" ? "sm:col-span-2" : ""}>
              <Label>{x.label}</Label>
              <Input className="mt-1.5" type={x.type ?? "text"} dir={x.ltr ? "ltr" : undefined} required={x.required} minLength={x.k === "password" ? 8 : undefined} value={f[x.k]} onChange={(e) => setF({ ...f, [x.k]: e.target.value })} />
            </div>
          ))}
          <Button type="submit" variant="hero" className="sm:col-span-2" disabled={m.isPending}>{m.isPending && <Loader2 className="animate-spin" />} إنشاء الحساب</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ merchant, onClose }: { merchant: Merchant | null; onClose: () => void }) {
  const reset = useServerFn(adminResetMerchantPassword);
  const [pw, setPw] = useState("");
  const m = useMutation({
    mutationFn: () => reset({ data: { userId: merchant!.id, password: pw } }),
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور");
      setPw("");
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Dialog open={!!merchant} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader className="text-start"><DialogTitle>كلمة مرور جديدة لـ {merchant?.first_name}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
          <Input dir="ltr" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8 أحرف على الأقل" />
          <Button type="submit" variant="hero" className="w-full" disabled={m.isPending}>حفظ</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
