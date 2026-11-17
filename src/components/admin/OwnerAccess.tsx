import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchMe } from "@/hooks/use-me";
import { createFirstAdmin, getAdminSetupState } from "@/lib/accounts.functions";
import { errorText } from "./labels";

/** Owner sign-in for /admin. While no owner account exists, it offers to create it once. */
export function OwnerAccess({ redirect }: { redirect: string }) {
  const navigate = useNavigate();
  const setupState = useServerFn(getAdminSetupState);
  const state = useQuery({ queryKey: ["admin-setup-state"], queryFn: () => setupState() });
  const createAdmin = useServerFn(createFirstAdmin);
  const needsSetup = state.data && !state.data.hasAdmin;

  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (needsSetup) await createAdmin({ data: f });
      const { error: err } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
      if (err) throw new Error("LOGIN");
      const me = await fetchMe();
      if (!me?.roles.includes("admin")) {
        await supabase.auth.signOut();
        throw new Error("NOT_OWNER");
      }
      navigate({ href: redirect, replace: true });
    } catch (e) {
      const m = (e as Error).message;
      setError(
        m === "LOGIN" ? "البريد أو كلمة المرور غير صحيحة." : m === "NOT_OWNER" ? "هذا الحساب ليس حساب المالك." : /regex|phone|invalid|too_small/i.test(m) ? "تحقق من المعلومات: الهاتف وكلمة مرور من 8 أحرف على الأقل." : errorText(e),
      );
    } finally {
      setBusy(false);
    }
  }

  const input = (k: keyof typeof f, label: string, type = "text", ltr = false) => (
    <div>
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} dir={ltr ? "ltr" : undefined} required minLength={k === "password" && needsSetup ? 8 : undefined} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1.5" />
    </div>
  );

  return (
    <div dir="rtl" lang="ar" className="flex min-h-screen items-center justify-center bg-gradient-blush px-4 py-10">
      <div className="w-full max-w-md animate-rise-in rounded-3xl border border-border bg-card p-8 shadow-lift">
        <span className="mx-auto flex h-12 w-12 items-center justify-center arch bg-gradient-sunset text-primary-foreground">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-center font-display text-4xl">{needsSetup ? "إنشاء حساب المالك" : "دخول المالك"}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {needsSetup ? "هذه أول مرة: أنشئ حسابك الخاص. لن تظهر هذه الصفحة مرة أخرى بعد إنشائه." : "لوحة خاصة بإدارة المتجر."}
        </p>
        {state.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            {needsSetup && (
              <div className="grid grid-cols-2 gap-3">
                {input("firstName", "الاسم")}
                {input("lastName", "اللقب")}
              </div>
            )}
            {needsSetup && input("phone", "رقم الهاتف", "tel", true)}
            {input("email", "البريد الإلكتروني", "email", true)}
            {input("password", needsSetup ? "كلمة المرور (8 أحرف على الأقل)" : "كلمة المرور", "password", true)}
            {error && <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} {needsSetup ? "إنشاء الحساب والدخول" : "دخول"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
