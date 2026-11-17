import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/store/AuthShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { registerMerchant } from "@/lib/accounts.functions";

export const Route = createFileRoute("/wholesale/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب تاجر — Lava Nder لافاندر" },
      { name: "description", content: "أنشئ حساب تاجر واطلب القطع الجبسية الخام بأسعار الجملة." },
      { property: "og:title", content: "إنشاء حساب تاجر — Lava Nder لافاندر" },
      { property: "og:description", content: "انضم إلى شبكة تجارنا واطلب بأسعار الجملة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MerchantRegister,
});

const PHONE = /^(?:\+213|0)\d{8,9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function MerchantRegister() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const register = useServerFn(registerMerchant);
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "", businessName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (f.firstName.trim().length < 2) errs["firstName"] = t("common.required");
    if (f.lastName.trim().length < 2) errs["lastName"] = t("common.required");
    if (!PHONE.test(f.phone.replace(/[\s-]/g, ""))) errs["phone"] = t("ws.invalidPhone");
    if (!EMAIL.test(f.email.trim())) errs["email"] = t("ws.invalidEmail");
    if (f.password.length < 8) errs["password"] = t("ws.passwordHint");
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await register({ data: { ...f, businessName: f.businessName || undefined } });
      const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim().toLowerCase(), password: f.password });
      if (error) throw error;
      toast.success(t("ws.signedIn"));
      navigate({ to: "/wholesale/catalog", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("EMAIL_TAKEN") ? t("ws.emailTaken") : t("ws.registerError"));
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={f[k]} onChange={set(k)} className="mt-1.5" maxLength={120} {...props} />
      {errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <AuthShell title={t("ws.registerTitle")} subtitle={t("ws.registerSubtitle")}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("firstName", t("ws.firstName"), { autoComplete: "given-name" })}
          {field("lastName", t("ws.lastName"), { autoComplete: "family-name" })}
        </div>
        {field("phone", t("ws.phone"), { dir: "ltr", inputMode: "tel", placeholder: "05 XX XX XX XX", autoComplete: "tel", maxLength: 16 })}
        {field("email", t("ws.email"), { dir: "ltr", type: "email", autoComplete: "email" })}
        {field("password", t("ws.password"), { dir: "ltr", type: "password", autoComplete: "new-password", placeholder: t("ws.passwordHint"), maxLength: 72 })}
        {field("businessName", t("ws.business"))}
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} {t("ws.register")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("ws.haveAccount")}{" "}
        <Link to="/auth" className="font-medium text-primary hover:underline">
          {t("ws.login")}
        </Link>
      </p>
    </AuthShell>
  );
}
