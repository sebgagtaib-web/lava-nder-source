import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Spinner } from "@/components/admin/AdminLayout";
import { errorText } from "@/components/admin/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [{ title: "التصنيفات — لوحة المالك" }] }),
  component: CategoriesPage,
});

type Cat = { id: string; name_ar: string; name_fr: string | null; name_en: string | null; slug: string; sort_order: number };

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").slice(0, 40) || `cat-${Date.now().toString(36)}`;

function CategoriesPage() {
  const cats = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Cat[];
    },
  });

  return (
    <>
      <PageHeader title="التصنيفات" subtitle="تظهر في المتجر لتسهيل التصفح (مثلاً: مزهريات، شمعدانات، ديكور جداري)." />
      {cats.isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          <NewCategory nextOrder={(cats.data?.length ?? 0) + 1} />
          {cats.data?.map((c) => <CategoryRow key={c.id} cat={c} />)}
        </div>
      )}
    </>
  );
}

function NewCategory({ nextOrder }: { nextOrder: number }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name_ar: "", name_fr: "", name_en: "" });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        name_ar: f.name_ar.trim(),
        name_fr: f.name_fr.trim() || null,
        name_en: f.name_en.trim() || null,
        slug: slugify(f.name_en || f.name_fr || "") + "-" + Math.random().toString(36).slice(2, 6),
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setF({ name_ar: "", name_fr: "", name_en: "" });
      toast.success("تمت إضافة التصنيف");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Panel className="border-dashed">
      <form onSubmit={(e) => { e.preventDefault(); if (f.name_ar.trim()) add.mutate(); }} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Input placeholder="الاسم بالعربية *" value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} required />
        <Input placeholder="Nom en français" dir="ltr" value={f.name_fr} onChange={(e) => setF({ ...f, name_fr: e.target.value })} />
        <Input placeholder="English name" dir="ltr" value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} />
        <Button type="submit" variant="hero" disabled={add.isPending}><Plus /> إضافة</Button>
      </form>
    </Panel>
  );
}

function CategoryRow({ cat }: { cat: Cat }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name_ar: cat.name_ar, name_fr: cat.name_fr ?? "", name_en: cat.name_en ?? "", sort_order: String(cat.sort_order) });
  const dirty = f.name_ar !== cat.name_ar || f.name_fr !== (cat.name_fr ?? "") || f.name_en !== (cat.name_en ?? "") || f.sort_order !== String(cat.sort_order);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("categories")
        .update({ name_ar: f.name_ar.trim(), name_fr: f.name_fr.trim() || null, name_en: f.name_en.trim() || null, sort_order: Number(f.sort_order) || 0 })
        .eq("id", cat.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error(errorText(e)),
  });
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").delete().eq("id", cat.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم حذف التصنيف"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Panel>
      <div className="grid items-center gap-3 sm:grid-cols-[4rem_1fr_1fr_1fr_auto]">
        <Input type="number" title="الترتيب" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} />
        <Input value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} />
        <Input dir="ltr" placeholder="Français" value={f.name_fr} onChange={(e) => setF({ ...f, name_fr: e.target.value })} />
        <Input dir="ltr" placeholder="English" value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} />
        <div className="flex gap-1">
          <Button size="icon" variant={dirty ? "default" : "ghost"} disabled={!dirty || save.isPending} onClick={() => save.mutate()} aria-label="حفظ"><Save /></Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive"
            aria-label="حذف"
            onClick={() => { if (window.confirm(`حذف تصنيف «${cat.name_ar}»؟ المنتجات تبقى لكن بدون تصنيف.`)) remove.mutate(); }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </Panel>
  );
}
