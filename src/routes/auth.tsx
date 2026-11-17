import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/store/AuthShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { fetchMe } from "@/hooks/use-me";
import { OwnerAccess } from "@/components/admin/OwnerAccess";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//")
      ? { redirect: s["redirect"] }
      : {},
  head: () => ({
    meta: [
      { title: "دخول التجار — Lava Nder لافاندر" },
      { name: "description", content: "سجّل الدخول إلى حساب التاجر للطلب بأسعار الجملة." },
      { property: "og:title", content: "دخول التجار — Lava Nder لافاندر" },
      { property: "og:description", content: "حساب التاجر للطلب بأسعار الجملة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MerchantLogin,
});

function MerchantLogin() {
  const search = Route.useSearch();
  if (search.redirect?.startsWith("/admin")) return <OwnerAccess redirect={search.redirect} />;
  return <MerchantLoginForm />;
}

function MerchantLoginForm() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setError(t("ws.loginError"));
      setBusy(false);
      return;
    }
    const me = await fetchMe();
    setBusy(false);
    if (me?.roles.includes("admin")) navigate({ to: "/admin", replace: true });
    else if (search.redirect) navigate({ href: search.redirect, replace: true });
    else navigate({ to: "/wholesale/catalog", replace: true });
  }

  return (
    <AuthShell title={t("ws.loginTitle")} subtitle={t("ws.loginSubtitle")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("ws.email")}</Label>
          <Input id="email" type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">{t("ws.password")}</Label>
          <Input id="password" type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
        </div>
        {error && <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} {t("ws.login")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("ws.noAccount")}{" "}
        <Link to="/wholesale/register" className="font-medium text-primary hover:underline">
          {t("ws.register")}
        </Link>
      </p>
    </AuthShell>
  );
}
