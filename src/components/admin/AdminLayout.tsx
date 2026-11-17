import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { useSignOut } from "@/hooks/use-sign-out";
import { useStoreSettings } from "@/hooks/use-store-settings";
import logoUrl from "@/assets/lavander-logo.png";

const LINKS = [
  { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "الطلبات", icon: ReceiptText },
  { to: "/admin/products", label: "المنتجات", icon: Package },
  { to: "/admin/categories", label: "التصنيفات", icon: Tags },
  { to: "/admin/merchants", label: "التجار", icon: Users },
  { to: "/admin/delivery", label: "أسعار التوصيل", icon: Truck },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
] as const;

function Nav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pending = useQuery({
    queryKey: ["admin", "pending-count"],
    queryFn: async () => {
      const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending");
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ to, label, icon: Icon, ...rest }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: "exact" in rest }}
          className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground font-medium" }}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{label}</span>
          {to === "/admin/orders" && !!pending.data && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">{pending.data}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const settings = useStoreSettings();
  const signOut = useSignOut("/admin");
  return (
    <div className="flex h-full flex-col gap-8 p-5">
      <div className="flex items-center gap-3">
        <img src={logoUrl} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
        <div>
          <p className="font-display text-xl leading-none">{settings.store_name}</p>
          <p className="mt-1 text-xs text-sidebar-foreground/60">لوحة المالك</p>
        </div>
      </div>
      <Nav onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-1 border-t border-sidebar-border pt-4">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
          <Store className="h-4 w-4" /> عرض المتجر
        </a>
        <button onClick={signOut} className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-start text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

/** Owner dashboard shell. Pages only mount for an owner account. */
export function AdminLayout({ children }: { children: ReactNode }) {
  const me = useMe();
  const signOut = useSignOut("/admin");
  const [open, setOpen] = useState(false);

  if (me.isLoading) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!me.data?.roles.includes("admin")) {
    return (
      <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-blush px-6 text-center">
        <p className="text-lg">هذا الحساب لا يملك صلاحية الدخول إلى لوحة المالك.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={signOut}>تسجيل الخروج</Button>
          <Button asChild variant="hero"><Link to="/">العودة للمتجر</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <DirectionProvider dir="rtl">
    <div dir="rtl" lang="ar" className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 start-0 hidden w-64 bg-sidebar text-sidebar-foreground lg:block">
        <SidebarBody />
      </aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="القائمة"><Menu className="!size-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-0 bg-sidebar p-0 text-sidebar-foreground">
            <SheetTitle className="sr-only">القائمة</SheetTitle>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-display text-xl">لوحة المالك</span>
        <span className="w-10" />
      </header>
      <main className="lg:ps-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
    </DirectionProvider>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-border bg-card p-5 shadow-soft ${className}`}>{children}</div>;
}

export function Spinner() {
  return (
    <div className="flex justify-center py-20 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
