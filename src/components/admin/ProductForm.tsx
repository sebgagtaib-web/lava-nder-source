import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dzd, errorText } from "./labels";
import { uploadProductImage } from "./upload";

export type AdminProduct = {
  id: string;
  channel: "retail" | "wholesale";
  name_ar: string;
  name_fr: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  min_quantity: number;
  images: string[];
  colors: string[];
  sizes: string[];
  material: string | null;
  stock: number | null;
  is_bundle_eligible: boolean;
  is_featured: boolean;
  is_active: boolean;
  product_costs: { cost_price: number } | null;
};

type Category = { id: string; name_ar: string };

const splitList = (s: string) => s.split(/[,،]/).map((x) => x.trim()).filter(Boolean);
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

export function ProductForm({
  product,
  channel,
  categories,
  defaultMinQty,
  onDone,
}: {
  product: AdminProduct | null;
  channel: "retail" | "wholesale";
  categories: Category[];
  defaultMinQty: number;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const p = product;
  const [f, setF] = useState({
    channel: p?.channel ?? channel,
    name_ar: p?.name_ar ?? "",
    name_fr: p?.name_fr ?? "",
    name_en: p?.name_en ?? "",
    description_ar: p?.description_ar ?? "",
    description_fr: p?.description_fr ?? "",
    description_en: p?.description_en ?? "",
    category_id: p?.category_id ?? "none",
    price: p ? String(p.price) : "",
    compare_at_price: p?.compare_at_price != null ? String(p.compare_at_price) : "",
    cost_price: p?.product_costs ? String(p.product_costs.cost_price) : "",
    min_quantity: String(p?.min_quantity ?? (channel === "wholesale" ? defaultMinQty : 1)),
    stock: p?.stock != null ? String(p.stock) : "",
    colors: (p?.colors ?? []).join("، "),
    sizes: (p?.sizes ?? []).join("، "),
    material: p?.material ?? "",
    is_bundle_eligible: p?.is_bundle_eligible ?? false,
    is_featured: p?.is_featured ?? false,
    is_active: p?.is_active ?? true,
  });
  const [images, setImages] = useState<string[]>(p?.images ?? []);
  const [uploading, setUploading] = useState(0);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const wholesale = f.channel === "wholesale";

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((x) => x.type.startsWith("image/"));
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const url = await uploadProductImage(file);
        setImages((imgs) => [...imgs, url]);
      } catch (e) {
        toast.error("تعذر رفع صورة: " + file.name);
        console.error(e);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const price = Number(f.price);
      if (!f.name_ar.trim()) throw new Error("NAME");
      if (!(price > 0)) throw new Error("PRICE");
      const row = {
        channel: f.channel,
        name_ar: f.name_ar.trim(),
        name_fr: f.name_fr.trim() || null,
        name_en: f.name_en.trim() || null,
        description_ar: f.description_ar.trim() || null,
        description_fr: f.description_fr.trim() || null,
        description_en: f.description_en.trim() || null,
        category_id: f.category_id === "none" ? null : f.category_id,
        price,
        compare_at_price: numOrNull(f.compare_at_price),
        min_quantity: Math.max(1, Math.round(Number(f.min_quantity) || 1)),
        stock: numOrNull(f.stock),
        colors: splitList(f.colors),
        sizes: splitList(f.sizes),
        material: f.material.trim() || null,
        is_bundle_eligible: !wholesale && f.is_bundle_eligible,
        is_featured: f.is_featured,
        is_active: f.is_active,
        images,
      };
      let id = p?.id;
      if (id) {
        const { error } = await supabase.from("products").update(row).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(row).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      const { error: cErr } = await supabase.from("product_costs").upsert({ product_id: id, cost_price: Number(f.cost_price) || 0 });
      if (cErr) throw cErr;
    },
    onSuccess: () => {
      toast.success(p ? "تم حفظ التعديلات" : "تمت إضافة المنتج");
      qc.invalidateQueries({ queryKey: ["admin"] });
      onDone();
    },
    onError: (e) => {
      const m = (e as Error).message;
      toast.error(m === "NAME" ? "اكتب اسم المنتج بالعربية" : m === "PRICE" ? "أدخل سعراً صحيحاً" : errorText(e));
    },
  });

  const margin = Number(f.price) - (Number(f.cost_price) || 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-6"
    >
      <button type="button" onClick={onDone} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" /> رجوع للقائمة
      </button>
      <h2 className="font-display text-4xl">{p ? "تعديل المنتج" : "منتج جديد"}</h2>

      <Section title="الصور">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((src, i) => (
            <div key={src} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute start-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[10px]">الرئيسية</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-foreground/60 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                {i > 0 ? (
                  <button type="button" title="اجعلها الرئيسية" onClick={() => setImages((im) => [src, ...im.filter((x) => x !== src)])} className="rounded-full bg-card p-1.5"><Star className="h-3.5 w-3.5" /></button>
                ) : <span />}
                <button type="button" title="حذف" onClick={() => setImages((im) => im.filter((x) => x !== src))} className="rounded-full bg-card p-1.5 text-destructive"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div key={`u${i}`} className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-muted"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ))}
          <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 text-sm text-muted-foreground hover:border-primary hover:text-primary">
            <ImagePlus className="h-6 w-6" />
            إضافة صور
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          </label>
        </div>
      </Section>

      <Section title="الاسم والوصف">
        <Tabs defaultValue="ar">
          <TabsList>
            <TabsTrigger value="ar">العربية</TabsTrigger>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>
          {(["ar", "fr", "en"] as const).map((l) => (
            <TabsContent key={l} value={l} className="space-y-3" dir={l === "ar" ? "rtl" : "ltr"}>
              <Field label={l === "ar" ? "الاسم *" : "Nom / Name"}>
                <Input value={f[`name_${l}`]} onChange={(e) => set(`name_${l}`, e.target.value)} required={l === "ar"} />
              </Field>
              <Field label={l === "ar" ? "الوصف" : "Description"}>
                <Textarea rows={4} value={f[`description_${l}`]} onChange={(e) => set(`description_${l}`, e.target.value)} />
              </Field>
            </TabsContent>
          ))}
        </Tabs>
        <p className="text-xs text-muted-foreground">الفرنسية والإنجليزية اختياريتان؛ إن تركتهما فارغتين يظهر الاسم العربي.</p>
      </Section>

      <Section title="التصنيف والمتجر">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="يُعرض في">
            <Select value={f.channel} onValueChange={(v) => set("channel", v as typeof f.channel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="retail">متجر الزبائن (منتج نهائي)</SelectItem>
                <SelectItem value="wholesale">متجر التجار (قطع خام بالجملة)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="التصنيف">
            <Select value={f.category_id} onValueChange={(v) => set("category_id", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون تصنيف</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="السعر والتكلفة">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={wholesale ? "سعر القطعة بالجملة (د.ج) *" : "سعر البيع (د.ج) *"}>
            <Input type="number" min={0} inputMode="numeric" value={f.price} onChange={(e) => set("price", e.target.value)} required />
          </Field>
          {!wholesale && (
            <Field label="السعر قبل التخفيض (اختياري)">
              <Input type="number" min={0} inputMode="numeric" value={f.compare_at_price} onChange={(e) => set("compare_at_price", e.target.value)} />
            </Field>
          )}
          <Field label="تكلفة الصنع (لا تظهر لأحد)">
            <Input type="number" min={0} inputMode="numeric" value={f.cost_price} onChange={(e) => set("cost_price", e.target.value)} />
          </Field>
        </div>
        {Number(f.price) > 0 && (
          <p className="text-sm text-muted-foreground">ربحك في القطعة: <span className={margin >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"}>{dzd(margin)}</span></p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {wholesale && (
            <Field label="أقل كمية للطلب *">
              <Input type="number" min={1} inputMode="numeric" value={f.min_quantity} onChange={(e) => set("min_quantity", e.target.value)} required />
            </Field>
          )}
          <Field label="الكمية المتوفرة (فارغ = غير محدود)">
            <Input type="number" min={0} inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="المواصفات">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="الألوان (افصل بفاصلة)">
            <Input value={f.colors} onChange={(e) => set("colors", e.target.value)} placeholder="أبيض، رملي، وردي" />
          </Field>
          <Field label="الأحجام / المقاسات">
            <Input value={f.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="صغير 15سم، كبير 30سم" />
          </Field>
          <Field label="المادة / الخامة">
            <Input value={f.material} onChange={(e) => set("material", e.target.value)} placeholder="جبس سيراميك، جبس أبيض..." />
          </Field>
        </div>
      </Section>

      <Section title="الظهور">
        <div className="space-y-3">
          <Toggle label="ظاهر في المتجر" hint="أوقفه لإخفاء المنتج دون حذفه" checked={f.is_active} onChange={(v) => set("is_active", v)} />
          {!wholesale && <Toggle label="مميَّز" hint="يظهر في الصفحة الرئيسية" checked={f.is_featured} onChange={(v) => set("is_featured", v)} />}
          {!wholesale && <Toggle label="متاح في التجميعة" hint="يمكن للزبون اختياره لتكوين تجميعة بخصم" checked={f.is_bundle_eligible} onChange={(v) => set("is_bundle_eligible", v)} />}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-1 flex gap-3 bg-background/95 px-1 py-4 backdrop-blur">
        <Button type="submit" variant="hero" size="lg" disabled={save.isPending || uploading > 0}>
          {save.isPending && <Loader2 className="animate-spin" />} {p ? "حفظ التعديلات" : "إضافة المنتج"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={onDone}>إلغاء</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <p className="font-display text-2xl">{title}</p>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-muted/50 px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
