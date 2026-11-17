import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Home, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { formatDZD } from "@/lib/format";
import { computeTotals, deliveryFee, wholesaleMinimumViolations, type BundleRule, type DeliveryType } from "@/lib/pricing";
import type { CartLine } from "@/lib/cart";
import { getDeliveryRates } from "@/lib/public.functions";
import { placeRetailOrder, placeWholesaleOrder } from "@/lib/orders.functions";
import { cn } from "@/lib/utils";

const PHONE = /^(?:\+213|0)\d{8,9}$/;

export function CheckoutForm({
  channel,
  lines,
  rule,
  defaults,
  onPlaced,
}: {
  channel: "retail" | "wholesale";
  lines: CartLine[];
  rule?: BundleRule;
  defaults?: { name?: string; phone?: string };
  onPlaced: (orderNumber: number) => void;
}) {
  const { t, lang } = useI18n();
  const rates = useQuery({ queryKey: ["delivery-rates"], queryFn: () => getDeliveryRates(), staleTime: 5 * 60_000 });
  const placeRetail = useServerFn(placeRetailOrder);
  const placeWholesale = useServerFn(placeWholesaleOrder);

  const [name, setName] = useState(defaults?.name ?? "");
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [wilaya, setWilaya] = useState<string>("");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<DeliveryType>("office");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rate = rates.data?.find((r) => String(r.wilaya_code) === wilaya);
  const normRate = rate ? { ...rate, office_price: Number(rate.office_price), home_price: Number(rate.home_price) } : null;
  const fee = deliveryFee(normRate, type);
  const priced = lines.map((l) => ({ unitPrice: l.price, quantity: l.quantity, inBundle: l.inBundle }));
  const totals = computeTotals(priced, fee ?? 0, rule);
  const violations = useMemo(() => (channel === "wholesale" ? wholesaleMinimumViolations(lines) : []), [channel, lines]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs["name"] = t("common.required");
    if (!PHONE.test(phone.replace(/[\s-]/g, ""))) errs["phone"] = t("common.required");
    if (!wilaya) errs["wilaya"] = t("common.required");
    if (commune.trim().length < 2) errs["commune"] = t("common.required");
    if (type === "home" && address.trim().length < 3) errs["address"] = t("common.required");
    if (fee === null && wilaya) errs["type"] = t("checkout.unavailable");
    setErrors(errs);
    if (Object.keys(errs).length || violations.length) return;

    setSubmitting(true);
    try {
      const payload = {
        customerName: name,
        customerPhone: phone,
        wilayaCode: Number(wilaya),
        commune,
        address: address || undefined,
        deliveryType: type,
        notes: notes || undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          color: l.color,
          size: l.size,
          inBundle: l.inBundle,
        })),
      };
      const res = channel === "retail" ? await placeRetail({ data: payload }) : await placeWholesale({ data: payload });
      onPlaced(res.orderNumber);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.startsWith("MIN_QTY")) toast.error(t("ws.minWarning", { n: msg.split(":")[2] ?? "" }));
      else if (msg.includes("DELIVERY_UNAVAILABLE")) toast.error(t("checkout.unavailable"));
      else if (msg.includes("ACCOUNT_INACTIVE")) toast.error(t("ws.inactive"));
      else toast.error(t("checkout.error"));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldErr = (k: string) => errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <h2 className="font-display text-3xl">{t("checkout.title")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">{t("checkout.fullName")}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="mt-1.5" />
          {fieldErr("name")}
        </div>
        <div>
          <Label htmlFor="phone">{t("checkout.phone")}</Label>
          <Input id="phone" dir="ltr" inputMode="tel" placeholder="05 XX XX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={16} className="mt-1.5" />
          {fieldErr("phone")}
        </div>
        <div>
          <Label>{t("checkout.wilaya")}</Label>
          <Select value={wilaya} onValueChange={setWilaya}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder={t("checkout.wilaya")} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(rates.data ?? []).map((r) => (
                <SelectItem key={r.wilaya_code} value={String(r.wilaya_code)}>
                  {String(r.wilaya_code).padStart(2, "0")} — {lang === "ar" ? r.name_ar : r.name_fr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErr("wilaya")}
        </div>
        <div>
          <Label htmlFor="commune">{t("checkout.commune")}</Label>
          <Input id="commune" value={commune} onChange={(e) => setCommune(e.target.value)} maxLength={120} className="mt-1.5" />
          {fieldErr("commune")}
        </div>
      </div>

      <div>
        <Label>{t("checkout.deliveryType")}</Label>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(["office", "home"] as const).map((opt) => {
            const optFee = deliveryFee(normRate, opt);
            const disabled = !!rate && optFee === null;
            const Icon = opt === "office" ? Building2 : Home;
            return (
              <button
                type="button"
                key={opt}
                disabled={disabled}
                onClick={() => setType(opt)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-start transition-all",
                  type === opt ? "border-primary bg-accent/60 ring-1 ring-primary" : "border-border hover:border-primary/40",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{t(`checkout.${opt}`)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {!rate ? "—" : optFee === null ? t("checkout.unavailable") : formatDZD(optFee, lang)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {fieldErr("type")}
      </div>

      <div>
        <Label htmlFor="address">{t("checkout.address")}</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} className="mt-1.5" />
        {fieldErr("address")}
      </div>
      <div>
        <Label htmlFor="notes">{t("checkout.notes")}</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} className="mt-1.5" />
      </div>

      <div className="space-y-2 rounded-2xl bg-muted/70 p-5 text-sm">
        <Row label={t("cart.subtotal")} value={formatDZD(totals.subtotal, lang)} />
        {totals.discount > 0 && <Row label={t("cart.discount")} value={`− ${formatDZD(totals.discount, lang)}`} accent />}
        <Row label={t("cart.delivery")} value={rate ? (fee === null ? "—" : formatDZD(fee, lang)) : t("cart.chooseWilaya")} />
        <div className="my-2 h-px bg-border" />
        <Row label={t("cart.total")} value={formatDZD(totals.total, lang)} big />
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wallet className="h-4 w-4 text-primary" /> {t("checkout.cod")}
      </p>

      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting || lines.length === 0 || violations.length > 0}>
        {submitting ? (
          <>
            <Loader2 className="animate-spin" /> {t("checkout.placing")}
          </>
        ) : (
          t("checkout.place")
        )}
      </Button>
    </form>
  );
}

function Row({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={big ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={cn(big && "font-display text-2xl font-semibold text-primary", accent && "font-medium text-success")}>{value}</span>
    </div>
  );
}
