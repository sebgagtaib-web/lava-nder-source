import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Hand, Palette, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { getCatalog } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { useStoreSettings } from "@/hooks/use-store-settings";
import hero from "@/assets/hero-plaster.jpg";

export const Route = createFileRoute("/")({
  loader: () => getCatalog(),
  head: () => ({
    meta: [
      { title: "Lava Nder لافاندر — ديكورات جبسية مصنوعة يدوياً" },
      { name: "description", content: "مزهريات، شمعدانات وديكورات جدارية من الجبس مصنوعة يدوياً. كوّني تجميعتك واحصلي على خصم، مع توصيل لكل الولايات." },
      { property: "og:title", content: "Lava Nder لافاندر — ديكورات جبسية مصنوعة يدوياً" },
      { property: "og:description", content: "قطع جبسية فنية مصنوعة يدوياً لتزيين بيتك، توصيل لكل الولايات والدفع عند الاستلام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { categories, products } = Route.useLoaderData();
  const settings = useStoreSettings();
  const { t, pick, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const featured = (products.filter((p) => p.is_featured).length ? products.filter((p) => p.is_featured) : products).slice(0, 4);
  const bundlePics = products.filter((p) => p.is_bundle_eligible && p.images[0]).slice(0, 3);

  return (
    <StoreLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-blush grain">
        <div className="pointer-events-none absolute -top-24 -start-24 h-80 w-80 rounded-full bg-blush/50 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-rise-in">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-4 py-1.5 text-sm text-primary">
              <Hand className="h-4 w-4" /> {t("hero.eyebrow")}
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.1] text-foreground sm:text-6xl lg:text-7xl">{t("hero.title")}</h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">{t("hero.subtitle")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/shop">
                  {t("hero.shop")} <Arrow />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/bundle">{t("hero.bundle")}</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 arch border border-primary/25" />
            <div className="relative overflow-hidden arch shadow-lift">
              <img src={hero} alt={settings.store_name} width={1280} height={1600} className="aspect-[4/5] w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -start-6 animate-float-soft rounded-2xl bg-card px-5 py-4 shadow-lift">
              <p className="font-display text-3xl text-primary">100%</p>
              <p className="text-xs text-muted-foreground">{t("home.story.p1")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 pt-20">
        <h2 className="text-center font-display text-4xl">{t("home.categories")}</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug }}
              className="rounded-full border border-border bg-card px-6 py-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:text-primary"
            >
              {pick(c, "name")}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-6 pt-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl">{t("home.featured")}</h2>
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            {t("home.viewAll")} <Arrow className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto mt-24 max-w-7xl px-6">
        <div className="grid gap-10 rounded-[2.5rem] bg-secondary/70 p-10 md:grid-cols-[1.2fr_1fr] md:p-16">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl">{t("home.story.title")}</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{t("home.story.body")}</p>
          </div>
          <ul className="grid gap-4">
            {[
              { icon: Hand, label: t("home.story.p1") },
              { icon: Palette, label: t("home.story.p2") },
              { icon: Truck, label: t("home.story.p3") },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4 rounded-2xl bg-card/80 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-sunset text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bundle teaser */}
      <section className="mx-auto mt-24 grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
        <div className="flex items-end justify-center gap-3">
          {bundlePics.map((p, i) => (
            <div key={p.id} className={`overflow-hidden arch shadow-soft ${i === 1 ? "w-40 sm:w-48" : "w-28 sm:w-36"}`}>
              <img src={p.images[0]} alt={pick(p, "name")} loading="lazy" className="aspect-[3/4] w-full object-cover" />
            </div>
          ))}
        </div>
        <div>
          <h2 className="font-display text-4xl sm:text-5xl">{t("home.bundle.title")}</h2>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            {t("home.bundle.body", { p: Number(settings.bundle_discount_percent), n: settings.bundle_min_items })}
          </p>
          <Button asChild variant="hero" size="lg" className="mt-8">
            <Link to="/bundle">{t("home.bundle.cta")}</Link>
          </Button>
        </div>
      </section>

      {/* Wholesale band */}
      <section className="mx-auto mt-24 max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-cocoa text-cocoa-foreground">
          <img src="/images/products/raw-pieces.jpg" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="relative max-w-2xl p-10 md:p-16">
            <p className="text-sm uppercase tracking-widest text-primary-soft">{t("ws.eyebrow")}</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">{t("home.wholesale.title")}</h2>
            <p className="mt-4 text-lg opacity-85">{t("home.wholesale.body")}</p>
            <Button asChild variant="hero" size="lg" className="mt-8">
              <Link to="/wholesale">{t("home.wholesale.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
