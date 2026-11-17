import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { LanguageSwitcher } from "./LanguageSwitcher";
import logoUrl from "@/assets/lavander-logo.png";

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function CartBadge({ channel, to }: { channel: "retail" | "wholesale"; to: "/cart" | "/wholesale/cart" }) {
  const { count } = useCart();
  const mounted = useMounted();
  const n = mounted ? count(channel) : 0;
  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label="cart">
      <Link to={to}>
        <ShoppingBag className="!size-5" />
        {n > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
            {n}
          </span>
        )}
      </Link>
    </Button>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  const settings = useStoreSettings();
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label={settings.store_name}>
      <img src={logoUrl} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
      <span className="font-display text-2xl font-semibold leading-none text-foreground">{settings.store_name}</span>
    </Link>
  );
}

export function StoreLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const settings = useStoreSettings();
  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/shop", label: t("nav.shop") },
    { to: "/bundle", label: t("nav.bundle") },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-cocoa py-2 text-center text-xs text-cocoa-foreground">
        <span className="inline-flex items-center gap-2">
          <Truck className="h-3.5 w-3.5" />
          {t("home.story.p3")} · {t("product.cod")}
        </span>
      </div>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="menu">
                  <Menu className="!size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <nav className="mt-10 flex flex-col gap-1">
                  {links.map((l) => (
                    <Link key={l.to} to={l.to} className="rounded-xl px-4 py-3 text-lg hover:bg-accent" activeOptions={{ exact: true }} activeProps={{ className: "bg-accent text-primary" }}>
                      {l.label}
                    </Link>
                  ))}
                  <Link to="/wholesale" className="mt-4 rounded-full bg-cocoa px-4 py-3 text-center text-cocoa-foreground">
                    {t("nav.wholesale")}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <Logo />
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: true }}
                className="rounded-full px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent !text-primary font-medium" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Button asChild variant="cocoa" size="sm" className="hidden sm:inline-flex">
              <Link to="/wholesale">{t("nav.wholesale")}</Link>
            </Button>
            <LanguageSwitcher />
            <CartBadge channel="retail" to="/cart" />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-24 bg-cocoa text-cocoa-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
          <div>
            <p className="font-display text-3xl">{settings.store_name}</p>
            <p className="mt-3 max-w-xs text-sm opacity-80">{settings.tagline || t("footer.tagline")}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="mb-3 font-semibold">{t("nav.shop")}</p>
            <Link to="/shop" className="block opacity-80 hover:opacity-100">{t("nav.shop")}</Link>
            <Link to="/bundle" className="block opacity-80 hover:opacity-100">{t("nav.bundle")}</Link>
            <Link to="/wholesale" className="block opacity-80 hover:opacity-100">{t("nav.wholesale")}</Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="mb-3 font-semibold">{t("footer.contact")}</p>
            {settings.phone && <p className="opacity-80" dir="ltr">{settings.phone}</p>}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="block opacity-80 hover:opacity-100">Instagram</a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noreferrer" className="block opacity-80 hover:opacity-100">Facebook</a>
            )}
            <p className="opacity-80">{t("product.cod")}</p>
          </div>
        </div>
        <div className="border-t border-cocoa-foreground/15 py-5 text-center text-xs opacity-70">
          © {new Date().getFullYear()} {settings.store_name} — {t("footer.rights")}
        </div>
      </footer>
    </div>
  );
}
