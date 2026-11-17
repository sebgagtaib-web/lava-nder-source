import type { ReactNode } from "react";
import { Logo } from "./StoreLayout";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Centered card on a soft background, used by the merchant sign-in and sign-up pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-blush">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <LanguageSwitcher />
      </header>
      <main className="mx-auto flex max-w-5xl justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg animate-rise-in rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-10">
          <h1 className="font-display text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
