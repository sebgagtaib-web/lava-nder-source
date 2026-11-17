import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgePercent, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreLayout } from "@/components/store/StoreLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/wholesale/")({
  head: () => ({
    meta: [
      { title: "ابدأ مشروعك معنا — بيع الجملة | Lava Nder لافاندر" },
      { name: "description", content: "قطع جبسية خام بأسعار الجملة للتجار وأصحاب المشاريع، توصيل لكل الولايات." },
      { property: "og:title", content: "ابدأ مشروعك معنا — Lava Nder لافاندر" },
      { property: "og:description", content: "قطع جبسية خام غير منتهية بأسعار جملة مخفضة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WholesaleLanding,
});

function WholesaleLanding() {
  const { t } = useI18n();
  const benefits = [
    { icon: BadgePercent, title: t("ws.b1.title"), body: t("ws.b1.body") },
    { icon: Package, title: t("ws.b2.title"), body: t("ws.b2.body") },
    { icon: Truck, title: t("ws.b3.title"), body: t("ws.b3.body") },
  ];
  return (
    <StoreLayout>
      <section className="relative overflow-hidden bg-cocoa text-cocoa-foreground">
        <img src="/images/products/raw-pieces.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="text-sm uppercase tracking-widest text-primary-soft">{t("ws.eyebrow")}</p>
          <h1 className="mt-4 font-display text-5xl sm:text-6xl">{t("ws.title")}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg opacity-85">{t("ws.subtitle")}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/wholesale/register">{t("ws.register")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-cocoa-foreground/40 bg-transparent text-cocoa-foreground hover:bg-cocoa-foreground/10 hover:text-cocoa-foreground">
              <Link to="/auth">{t("ws.login")}</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pt-16 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-sunset text-primary-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 font-display text-2xl">{title}</h2>
            <p className="mt-2 text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-6 pt-12 text-center">
        <Link to="/shop" className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
          {t("ws.backToStore")}
        </Link>
      </section>
    </StoreLayout>
  );
}
