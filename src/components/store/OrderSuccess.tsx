import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function OrderSuccess({ orderNumber, backTo }: { orderNumber: number; backTo: "/shop" | "/wholesale/catalog" }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-lg animate-rise-in rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-4xl">{t("checkout.success.title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("checkout.success.body")}</p>
      <p className="mt-2 font-display text-5xl text-primary">#{orderNumber}</p>
      <Button asChild variant="outline" className="mt-8">
        <Link to={backTo}>{t("cart.continue")}</Link>
      </Button>
    </div>
  );
}
