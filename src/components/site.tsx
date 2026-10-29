import { Localized } from '@/components/localized';
import { Link, useRouterState } from "@tanstack/react-router";
import { BackLink } from '@/components/back-link';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useCustomerAuth } from '@/components/customer-auth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LocaleProvider, useLocale } from '@/lib/locale';

export const LANGS = {
  en: { label: "EN", full: "English", signin: "Log in", login: "Login to user profile", h: "Banking, clearly.", sub: "Simple accounts, transparent fees, and complete control over your money—wherever life takes you.", cta: "Open an account", cta2: "Explore how it works", nav: [], dash: "Dashboard" },
  fr: { label: "FR", full: "Français", signin: "Connexion", login: "Accéder au profil", h: "La banque, en toute clarté.", sub: "Des comptes simples, des frais transparents et un contrôle total sur votre argent—où que la vie vous mène.", cta: "Ouvrir un compte", cta2: "Découvrir le fonctionnement", nav: [], dash: "Tableau de bord" },
  es: { label: "ES", full: "Español", signin: "Iniciar sesión", login: "Acceso al perfil", h: "Banca, con claridad.", sub: "Cuentas simples, comisiones transparentes y control total de tu dinero—dondequiera que te lleve la vida.", cta: "Abrir una cuenta", cta2: "Cómo funciona", nav: [], dash: "Panel" },
  de: { label: "DE", full: "Deutsch", signin: "Anmelden", login: "Zum Benutzerprofil", h: "Banking, ganz klar.", sub: "Einfache Konten, transparente Gebühren und volle Kontrolle über Ihr Geld—wohin das Leben Sie auch führt.", cta: "Konto eröffnen", cta2: "So funktioniert's", nav: [], dash: "Übersicht" },
  pt: { label: "PT", full: "Português", signin: "Entrar", login: "Acessar perfil", h: "Banco, com clareza.", sub: "Contas simples, tarifas transparentes e controle total do seu dinheiro—onde quer que a vida o leve.", cta: "Abrir conta", cta2: "Veja como funciona", nav: [], dash: "Painel" },
} as const;
export type Lang = keyof typeof LANGS;

export function LangProvider({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
export const useT = () => {
  const { lang, setLang } = useLocale();
  return { t: LANGS.en, lang, setLang };
};

export function Header() {
  const { t, lang, setLang } = useT();
  const { user } = useCustomerAuth();
  return (
    <Localized><header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="lang">Language</label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)}
            className="h-9 rounded-md border border-border bg-secondary px-2 text-xs font-semibold text-foreground">
            {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k} aria-label={v.full}>{v.label}</option>)}
          </select>
          <Link to="/" className="flex items-center gap-2 font-display text-base font-bold tracking-wider sm:text-lg">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold shadow-glow"><span className="h-2.5 w-2.5 rounded-full bg-background" /></span>
            <span className="whitespace-nowrap">LUMEN <span className="text-primary">BANK</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Button asChild variant="outline" className="h-10 rounded-full border-primary/40 px-5 text-sm font-semibold hover:bg-secondary">
              <Link to="/dashboard">My account</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="h-10 rounded-full px-4 text-sm font-semibold hover:bg-secondary">
                <Link to="/auth">Login to user profile</Link>
              </Button>
              <Button asChild className="h-10 rounded-full bg-gold px-5 text-sm font-semibold shadow-glow">
                <Link to="/open-account">Open an account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header></Localized>
  );
}

export function Footer() {
  return (
    <Localized><footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Lumen Bank. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link to="/auth" className="hover:text-primary transition">Login</Link>
          <Link to="/open-account" className="hover:text-primary transition">Open an account</Link>
        </div>
      </div>
    </footer></Localized>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: state => state.location.pathname });
  return (
    <Localized>
      <div className="flex min-h-screen flex-col justify-between">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </Localized>
  );
}

export function PageHero({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <Localized><section className="relative">
      <div className="pointer-events-none absolute inset-0 bg-light" />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 md:pt-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-[1.05] md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{sub}</p>
      </div>
    </section></Localized>
  );
}

export function CTA() {
  const { t } = useT();
  return (
    <Localized><section id="open" className="mx-auto max-w-6xl px-5 py-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-border p-10 text-center md:p-16">
        <div className="pointer-events-none absolute inset-0 bg-light" />
        <h2 className="relative text-4xl font-bold md:text-6xl">Bring your money <span className="text-gold">into the light.</span></h2>
        <p className="relative mx-auto mt-4 max-w-md text-muted-foreground">Open an account in about five minutes. No paperwork, no minimum balance.</p>
        <Button asChild className="relative mt-8 h-14 rounded-full bg-gold px-10 font-semibold shadow-glow"><Link to="/open-account">{t.cta}</Link></Button>
      </div>
    </section></Localized>
  );
}

export function Features({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  return (
    <Localized><section className="mx-auto max-w-6xl px-5 py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([title, body]) => (
          <div key={title} className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
            <h3 className="font-display text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section></Localized>
  );
}

export function Stats({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  return (
    <Localized><section className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map(([value, label]) => (
          <div key={label} className="rounded-3xl border border-border p-6 text-center">
            <p className="font-display text-3xl font-bold text-gold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section></Localized>
  );
}

export function FAQ({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  return (
    <Localized><section className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="mb-6 text-3xl font-bold">Questions, answered.</h2>
      <div className="space-y-3">
        {items.map(([q, a]) => (
          <details key={q} className="rounded-2xl border border-border bg-card/60 p-5">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-3 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section></Localized>
  );
}
