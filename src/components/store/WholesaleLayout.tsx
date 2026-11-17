import { Link } from "@tanstack/react-router";
import { Loader2, LogOut, Package, ReceiptText } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useMe } from "@/hooks/use-me";
import { useSignOut } from "@/hooks/use-sign-out";
import { CartBadge, Logo } from "./StoreLayout";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Merchant area shell. Children only mount for an active merchant account. */
export function WholesaleLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const me = useMe();
  const signOut = useSignOut("/wholesale");
  const isMerchant = !!me.data?.roles.includes("merchant");
  const active = !!me.data?.profile?.is_active;

  const navLink = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-cocoa py-2 text-center text-xs text-cocoa-foreground">{t("ws.eyebrow")}</div>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-1">
            {isMerchant && active && (
              <nav className="flex items-center">
                <Link to="/wholesale/catalog" className={navLink} activeProps={{ className: "bg-accent !text-primary font-medium" }}>
                  <Package className="h-4 w-4" /> <span className="hidden sm:inline">{t("ws.catalog")}</span>
                </Link>
                <Link to="/wholesale/orders" className={navLink} activeProps={{ className: "bg-accent !text-primary font-medium" }}>
                  <ReceiptText className="h-4 w-4" /> <span className="hidden sm:inline">{t("ws.orders")}</span>
                </Link>
                <CartBadge channel="wholesale" to="/wholesale/cart" />
              </nav>
            )}
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("ws.logout")} title={t("ws.logout")}>
              <LogOut className="!size-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {me.isLoading ? (
          <div className="flex justify-center py-32 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !isMerchant || !active ? (
          <div className="mx-auto max-w-md px-6 py-24 text-center">
            <p className="text-lg">{!isMerchant ? t("ws.notMerchant") : t("ws.inactive")}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={signOut}>{t("ws.logout")}</Button>
              <Button asChild variant="hero">
                <Link to="/shop">{t("ws.backToStore")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {me.data?.profile && (
              <p className="mx-auto max-w-7xl px-6 pt-8 text-sm text-muted-foreground">{t("ws.welcome", { name: me.data.profile.first_name })}</p>
            )}
            {children}
          </>
        )}
      </main>
      <footer className="mt-20 border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">{t("ws.backToStore")}</Link>
      </footer>
    </div>
  );
}
