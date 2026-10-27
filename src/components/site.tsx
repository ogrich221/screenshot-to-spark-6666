import { Link } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export const LANGS = {
  en: { label: "EN · English", h: "Banking, clearly.", sub: "Simple accounts, transparent fees, and complete control over your money—wherever life takes you.", cta: "Open an account", cta2: "Explore how it works", nav: ["How it works", "Pricing", "Savings", "Security"], dash: "Dashboard" },
  fr: { label: "FR · Français", h: "La banque, en toute clarté.", sub: "Des comptes simples, des frais transparents et un contrôle total sur votre argent—où que la vie vous mène.", cta: "Ouvrir un compte", cta2: "Découvrir le fonctionnement", nav: ["Fonctionnement", "Tarifs", "Épargne", "Sécurité"], dash: "Tableau de bord" },
  es: { label: "ES · Español", h: "Banca, con claridad.", sub: "Cuentas simples, comisiones transparentes y control total de tu dinero—dondequiera que te lleve la vida.", cta: "Abrir una cuenta", cta2: "Cómo funciona", nav: ["Cómo funciona", "Precios", "Ahorro", "Seguridad"], dash: "Panel" },
  de: { label: "DE · Deutsch", h: "Banking, ganz klar.", sub: "Einfache Konten, transparente Gebühren und volle Kontrolle über Ihr Geld—wohin das Leben Sie auch führt.", cta: "Konto eröffnen", cta2: "So funktioniert's", nav: ["So geht's", "Preise", "Sparen", "Sicherheit"], dash: "Übersicht" },
  pt: { label: "PT · Português", h: "Banco, com clareza.", sub: "Contas simples, tarifas transparentes e controle total do seu dinheiro—onde quer que a vida o leve.", cta: "Abrir conta", cta2: "Veja como funciona", nav: ["Como funciona", "Preços", "Poupança", "Segurança"], dash: "Painel" },
} as const;
export type Lang = keyof typeof LANGS;

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}
export const useT = () => {
  const { lang, setLang } = useContext(LangCtx);
  return { t: LANGS[lang], lang, setLang };
};

const PAGES = ["/how-it-works", "/pricing", "/savings", "/security"] as const;

function DashboardMenu() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="true"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-primary-foreground shadow-glow">
        <span aria-hidden className="grid grid-cols-2 gap-0.5">{[0, 1, 2, 3].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />)}</span>
        {t.dash}
      </button>
      {open && (
        <div className="absolute right-0 top-14 border border-border bg-popover shadow-soft z-50 w-72 rounded-3xl p-4 animate-in fade-in slide-in-from-top-2">
          <div className="rounded-2xl bg-secondary p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total balance</span>
              <button onClick={() => setShow(!show)} className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">{show ? "Hide" : "Show"}</button>
            </div>
            <p className="mt-1 font-display text-2xl font-bold">{show ? "$12,480.52" : "$••••••"}</p>
            <div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-full w-3/4 rounded-full bg-gold" /></div>
            <p className="mt-1.5 text-xs text-muted-foreground">Holiday goal · 74%</p>
          </div>
          <nav className="mt-3 grid grid-cols-2 gap-2">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-2xl bg-muted px-3 py-3 text-sm font-medium hover:bg-secondary" activeProps={{ className: "ring-1 ring-primary" }} activeOptions={{ exact: true }}>Home</Link>
            {PAGES.map((p, i) => (
              <Link key={p} to={p} onClick={() => setOpen(false)} className="rounded-2xl bg-muted px-3 py-3 text-sm font-medium hover:bg-secondary" activeProps={{ className: "ring-1 ring-primary" }}>{t.nav[i]}</Link>
            ))}
            <a href="#open" className="rounded-2xl bg-gold px-3 py-3 text-sm font-semibold text-primary-foreground">{t.cta}</a>
          </nav>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t, lang, setLang } = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="lang">Language</label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)}
            className="h-11 rounded-full border border-border bg-secondary px-3 text-sm font-medium text-foreground">
            {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-wider">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold shadow-glow"><span className="h-2.5 w-2.5 rounded-full bg-background" /></span>
            <span className="hidden sm:inline">LUMEN</span>
          </Link>
        </div>
        <nav className="hidden gap-7 text-sm font-medium text-muted-foreground lg:flex">
          {PAGES.map((p, i) => <Link key={p} to={p} className="hover:text-foreground" activeProps={{ className: "text-primary" }}>{t.nav[i]}</Link>)}
        </nav>
        <DashboardMenu />
      </div>
    </header>
  );
}

export function PageHero({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 bg-light" />
      <div className="pointer-events-none absolute inset-0 rays" />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 md:pt-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-[1.05] md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{sub}</p>
      </div>
    </section>
  );
}

export function CTA() {
  const { t } = useT();
  return (
    <section id="open" className="mx-auto max-w-6xl px-5 py-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-border p-10 text-center md:p-16">
        <div className="pointer-events-none absolute inset-0 bg-light" />
        <h2 className="relative text-4xl font-bold md:text-6xl">Bring your money <span className="text-gold">into the light.</span></h2>
        <p className="relative mx-auto mt-4 max-w-md text-muted-foreground">Open an account in about five minutes. No paperwork, no minimum balance.</p>
        <a href="#" className="relative mt-8 inline-flex h-14 items-center rounded-full bg-gold px-10 font-semibold text-primary-foreground shadow-glow">{t.cta}</a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 md:grid-cols-5">
        <div>
          <p className="font-display text-lg font-bold tracking-wider text-gold">LUMEN</p>
          <p className="mt-2 text-sm text-muted-foreground">Transparent by design.</p>
        </div>
        {([
          ["Products", [["Current account", "/how-it-works"], ["Savings", "/savings"], ["Pricing", "/pricing"]]],
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
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (<><Header /><main>{children}</main><CTA /><Footer /></>);
}
