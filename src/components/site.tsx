import { Localized } from '@/components/localized';
import { Link } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useCustomerAuth } from '@/components/customer-auth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LocaleProvider, useLocale } from '@/lib/locale';

export const LANGS = {
  en: { label: "EN", full: "English", signin: "Sign in", h: "Banking, clearly.", sub: "Simple accounts, transparent fees, and complete control over your money—wherever life takes you.", cta: "Open an account", cta2: "Explore how it works", nav: ["Personal Banking", "Fees & Pricing", "Savings & Goals", "Security Centre"], dash: "Dashboard" },
  fr: { label: "FR", full: "Français", signin: "Se connecter", h: "La banque, en toute clarté.", sub: "Des comptes simples, des frais transparents et un contrôle total sur votre argent—où que la vie vous mène.", cta: "Ouvrir un compte", cta2: "Découvrir le fonctionnement", nav: ["Banque au quotidien", "Frais & tarifs", "Épargne & objectifs", "Centre de sécurité"], dash: "Tableau de bord" },
  es: { label: "ES", full: "Español", signin: "Iniciar sesión", h: "Banca, con claridad.", sub: "Cuentas simples, comisiones transparentes y control total de tu dinero—dondequiera que te lleve la vida.", cta: "Abrir una cuenta", cta2: "Cómo funciona", nav: ["Banca personal", "Tarifas", "Ahorro y metas", "Centro de seguridad"], dash: "Panel" },
  de: { label: "DE", full: "Deutsch", signin: "Anmelden", h: "Banking, ganz klar.", sub: "Einfache Konten, transparente Gebühren und volle Kontrolle über Ihr Geld—wohin das Leben Sie auch führt.", cta: "Konto eröffnen", cta2: "So funktioniert's", nav: ["Privatkonto", "Gebühren & Preise", "Sparen & Ziele", "Sicherheitscenter"], dash: "Übersicht" },
  pt: { label: "PT", full: "Português", signin: "Entrar", h: "Banco, com clareza.", sub: "Contas simples, tarifas transparentes e controle total do seu dinheiro—onde quer que a vida o leve.", cta: "Abrir conta", cta2: "Veja como funciona", nav: ["Conta pessoal", "Tarifas", "Poupança e metas", "Central de segurança"], dash: "Painel" },
} as const;
export type Lang = keyof typeof LANGS;

export function LangProvider({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
export const useT = () => {
  const { lang, setLang } = useLocale();
  return { t: LANGS.en, lang, setLang };
};

const PAGES = ["/how-it-works", "/pricing", "/savings", "/security"] as const;

type MenuTo = "/" | (typeof PAGES)[number] | "/cards" | "/transfers" | "/business" | "/loans" | "/support" | "/admin";
const MENU: { group: string; items: [MenuTo, string, string, string][] }[] = [
  { group: "Banking", items: [
    ["/", "Home", "Overview", "⌂"],
    ["/how-it-works", "Personal Banking", "Everyday account", "◎"],
    ["/cards", "Cards", "Debit & metal cards", "▭"],
    ["/transfers", "Transfers", "Send money worldwide", "⇄"],
  ] },
  { group: "Grow", items: [
    ["/savings", "Savings & Goals", "Up to 4.1% interest", "◔"],
    ["/loans", "Loans", "Clear, fixed rates", "◇"],
    ["/business", "Business", "Accounts for teams", "▦"],
    ["/pricing", "Fees & Pricing", "Every fee listed", "$"],
  ] },
  { group: "Help", items: [
    ["/security", "Security Centre", "How we protect you", "◈"],
    ["/support", "Help & Support", "Real people, 24/7", "?"],
    ["/admin", "Staff admin", "Operations workspace", "⚙"],
  ] },
];

function DashboardMenu() {
  const { t } = useT();
  const { user } = useCustomerAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, []);
  return (
    <Localized><div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="true" aria-label={t.dash}
        className="grid h-11 w-11 place-items-center rounded-full bg-gold shadow-glow">
        <span aria-hidden className="flex flex-col gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className="block h-0.5 w-5 rounded bg-primary-foreground" />)}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-50 max-h-[80vh] w-[min(22rem,calc(100vw-2.5rem))] overflow-y-auto rounded-3xl border border-border bg-popover p-4 shadow-soft animate-in fade-in slide-in-from-top-2">
          {MENU.map((g) => (
            <div key={g.group} className="mb-3">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{g.group}</p>
              <nav className="grid grid-cols-2 gap-2">
                {g.items.map(([to, label, desc, icon]) => (
                  <Link key={to} to={to} onClick={() => setOpen(false)} className="flex gap-2.5 rounded-2xl bg-muted p-3 hover:bg-secondary" activeProps={{ className: "ring-1 ring-primary" }} activeOptions={{ exact: true }}>
                    <span aria-hidden className="text-primary">{icon}</span>
                    <span><span className="block text-sm font-medium leading-tight">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span></span>
                  </Link>
                ))}
              </nav>
            </div>
          ))}
          {user && <><Button asChild variant="outline" className="mb-2 h-12 w-full"><Link to="/dashboard" onClick={() => setOpen(false)}>My account</Link></Button><Button variant="ghost" className="mb-2 w-full" onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); setOpen(false); await navigate({ to: '/auth', replace: true }); }}>Sign out</Button></>}
          <Button asChild className="mt-1 h-12 w-full bg-gold"><Link to="/open-account" onClick={() => setOpen(false)}>{t.cta}</Link></Button>
          {!user && <Button asChild variant="link" className="mt-2 w-full"><Link to="/auth" onClick={() => setOpen(false)}>Customer sign-in</Link></Button>}
        </div>
      )}
    </div></Localized>
  );
}

export function Header() {
  const { t, lang, setLang } = useT();
  const { user } = useCustomerAuth();
  return (
    <Localized><header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="lang">Language</label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)}
            className="h-9 rounded-full border border-border bg-secondary px-2 text-xs font-semibold text-foreground">
            {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k} aria-label={v.full}>{v.label}</option>)}
          </select>
          <Link to="/" className="flex items-center gap-2 font-display text-base font-bold tracking-wider sm:text-lg">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold shadow-glow"><span className="h-2.5 w-2.5 rounded-full bg-background" /></span>
            <span className="whitespace-nowrap">LUMEN <span className="text-primary">BANK</span></span>
          </Link>
        </div>
        <nav className="hidden gap-6 text-sm font-medium text-muted-foreground xl:flex">
          {PAGES.map((p, i) => <Link key={p} to={p} className="hover:text-foreground" activeProps={{ className: "text-primary" }}>{t.nav[i]}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          {!user && (
            <Button asChild variant="outline" className="h-10 rounded-full border-primary/40 px-5 text-sm font-semibold hover:bg-secondary">
              <Link to="/auth">{t.signin}</Link>
            </Button>
          )}
          <DashboardMenu />
        </div>
      </div>
    </header></Localized>
  );
}

export function PageHero({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <Localized><section className="relative">
      <div className="pointer-events-none absolute inset-0 bg-light" />
      <div className="pointer-events-none absolute inset-0 rays" />
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

export function Footer() {
  return (
    <Localized><footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 md:grid-cols-5">
        <div>
          <p className="font-display text-lg font-bold tracking-wider text-gold">LUMEN</p>
          <p className="mt-2 text-sm text-muted-foreground">Transparent by design.</p>
        </div>
        {([
          ["Products", [["Personal banking", "/how-it-works"], ["Savings & goals", "/savings"], ["Fees & pricing", "/pricing"]]],
          ["Support", [["Help centre", "/how-it-works"], ["Contact us", "/security"]]],
          ["Security", [["How we protect you", "/security"], ["Report fraud", "/security"]]],
          ["Legal", [["Fee schedule", "/pricing"], ["Privacy", "/security"], ["Terms", "/pricing"]]],
        ] as const).map(([h, ls]) => (
          <div key={h}>
            <p className="text-sm font-semibold">{h}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {ls.map(([l, to]) => <li key={l}><Link to={to} className="hover:text-primary">{l}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 border-t border-border px-5 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© 2026 Lumen Bank. All rights reserved.</p>
        <div className="flex gap-5">{["Instagram", "LinkedIn", "X", "YouTube"].map((s) => <a key={s} href="#" className="hover:text-primary">{s}</a>)}</div>
      </div>
    </footer></Localized>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (<Localized><><Header /><main>{children}</main><CTA /><Footer /></></Localized>);
}

export function FAQ({ items }: { items: [string, string][] }) {
  return (
    <Localized><section className="mx-auto max-w-3xl px-5 pt-24">
      <h2 className="text-3xl font-bold">Frequently asked questions</h2>
      <div className="mt-8 divide-y divide-border border-y border-border">
        {items.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
              {q}<span aria-hidden className="text-primary transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section></Localized>
  );
}

export function Stats({ items }: { items: [string, string][] }) {
  return (
    <Localized><section className="mx-auto max-w-6xl px-5 pt-24">
      <dl className="grid grid-cols-2 gap-6 rounded-3xl border border-border p-8 md:grid-cols-4">
        {items.map(([v, l]) => (
          <div key={l}><dt className="font-display text-3xl font-bold text-gold">{v}</dt><dd className="mt-1 text-sm text-muted-foreground">{l}</dd></div>
        ))}
      </dl>
    </section></Localized>
  );
}

export function Features({ title, items }: { title?: string; items: [string, string][] }) {
  return (
    <Localized><section className="mx-auto max-w-6xl px-5 pt-4">
      {title && <h2 className="mb-10 text-3xl font-bold md:text-4xl">{title}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([h, p]) => (
          <div key={h} className="glass rounded-3xl p-8">
            <span aria-hidden className="block h-1 w-10 rounded-full bg-gold" />
            <h3 className="mt-5 text-xl font-semibold">{h}</h3>
            <p className="mt-2 text-muted-foreground">{p}</p>
          </div>
        ))}
      </div>
    </section></Localized>
  );
}
