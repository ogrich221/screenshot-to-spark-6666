import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen Bank — Banking, clearly." },
      { name: "description", content: "Simple accounts, transparent fees, and complete control over your money. Lumen Bank: transparent by design." },
      { property: "og:title", content: "Lumen Bank — Banking, clearly." },
      { property: "og:description", content: "Simple accounts, transparent fees, and complete control over your money." },
    ],
  }),
  component: Index,
});

const LANGS = {
  en: { label: "English", h: "Banking, clearly.", sub: "Simple accounts, transparent fees, and complete control over your money—wherever life takes you.", cta: "Open an account", cta2: "Explore how it works", nav: ["How it works", "Pricing", "Savings", "Security"] },
  fr: { label: "Français", h: "La banque, en toute clarté.", sub: "Des comptes simples, des frais transparents et un contrôle total sur votre argent—où que la vie vous mène.", cta: "Ouvrir un compte", cta2: "Découvrir le fonctionnement", nav: ["Fonctionnement", "Tarifs", "Épargne", "Sécurité"] },
  es: { label: "Español", h: "Banca, con claridad.", sub: "Cuentas simples, comisiones transparentes y control total de tu dinero—dondequiera que te lleve la vida.", cta: "Abrir una cuenta", cta2: "Cómo funciona", nav: ["Cómo funciona", "Precios", "Ahorro", "Seguridad"] },
  de: { label: "Deutsch", h: "Banking, ganz klar.", sub: "Einfache Konten, transparente Gebühren und volle Kontrolle über Ihr Geld—wohin das Leben Sie auch führt.", cta: "Konto eröffnen", cta2: "So funktioniert's", nav: ["So geht's", "Preise", "Sparen", "Sicherheit"] },
  pt: { label: "Português", h: "Banco, com clareza.", sub: "Contas simples, tarifas transparentes e controle total do seu dinheiro—onde quer que a vida o leve.", cta: "Abrir conta", cta2: "Veja como funciona", nav: ["Como funciona", "Preços", "Poupança", "Segurança"] },
} as const;
type Lang = keyof typeof LANGS;

// Indicative rates per 1 USD (non-African currencies only)
const RATES: Record<string, { name: string; rate: number }> = {
  USD: { name: "US Dollar", rate: 1 },
  EUR: { name: "Euro", rate: 0.92 },
  GBP: { name: "British Pound", rate: 0.79 },
  JPY: { name: "Japanese Yen", rate: 151.2 },
  CAD: { name: "Canadian Dollar", rate: 1.37 },
  AUD: { name: "Australian Dollar", rate: 1.52 },
  CHF: { name: "Swiss Franc", rate: 0.88 },
  CNY: { name: "Chinese Yuan", rate: 7.24 },
  INR: { name: "Indian Rupee", rate: 83.4 },
  BRL: { name: "Brazilian Real", rate: 5.05 },
  MXN: { name: "Mexican Peso", rate: 17.1 },
  SGD: { name: "Singapore Dollar", rate: 1.35 },
  AED: { name: "UAE Dirham", rate: 3.67 },
  SEK: { name: "Swedish Krona", rate: 10.6 },
  KRW: { name: "South Korean Won", rate: 1365 },
};

function Index() {
  const [lang, setLang] = useState<Lang>("en");
  const t = LANGS[lang];
  return (
    <div className="relative overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-light" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] rays" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold shadow-glow">
            <span className="h-3 w-3 rounded-full bg-background" />
          </span>
          LUMEN
        </a>
        <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
          {t.nav.map((n) => <a key={n} href="#how" className="hover:text-foreground">{n}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="lang">Language</label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)}
            className="glass h-11 rounded-full px-3 text-sm font-medium">
            {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <a href="#open" className="hidden h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground sm:inline-flex">{t.cta}</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 md:grid-cols-2 md:pt-20">
        <div>
          <span className="glass inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transparent by design</span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.02] md:text-7xl">{t.h}</h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">{t.sub}</p>
          <div id="open" className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#" className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5">{t.cta}</a>
            <a href="#how" className="glass inline-flex h-14 items-center justify-center rounded-full px-8 font-semibold">{t.cta2} →</a>
          </div>
        </div>
        <Phone />
      </section>

      {/* Trust */}
      <section className="relative z-10 mx-auto max-w-6xl px-5">
        <div className="glass grid grid-cols-2 gap-6 rounded-3xl p-6 md:grid-cols-4 md:p-8">
          {[["◎", "No hidden fees"], ["◉", "Real-time notifications"], ["◈", "Bank-grade security"], ["❍", "Human support when you need it"]].map(([i, l]) => (
            <div key={l} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-accent">{i}</span>
              <span className="text-sm font-semibold">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-5 py-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">How transparency works</p>
        <h2 className="mt-3 max-w-2xl text-4xl font-bold md:text-5xl">Nothing hidden. Everything in the light.</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            ["01", "Clear pricing", "Every fee is listed up front, in plain words. If something costs money, you'll know before you tap."],
            ["02", "Instant visibility", "See every payment the second it happens, with the merchant, the category and your balance after."],
            ["03", "You're in control", "Freeze your card, set limits, or move money in one tap. Your account works on your terms."],
          ].map(([n, h, p]) => (
            <div key={n} className="glass rounded-3xl p-8 transition hover:-translate-y-1">
              <span className="font-display text-sm font-semibold text-accent">{n}</span>
              <h3 className="mt-6 text-2xl font-semibold">{h}</h3>
              <p className="mt-3 text-muted-foreground">{p}</p>
            </div>
          ))}
        </div>
      </section>

      <Converter />

      {/* Savings */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 py-28 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Savings goals</p>
          <h2 className="mt-3 text-4xl font-bold md:text-5xl">Watch your plans come into focus.</h2>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">Name a goal, pick a date, and we'll show you exactly how much to set aside each week. No jargon, just progress.</p>
        </div>
        <div className="space-y-4">
          {[["Trip to Lisbon", 1840, 2500, "by June"], ["Rainy day fund", 3200, 5000, "steady"], ["New laptop", 620, 1400, "by March"]].map(([n, a, g, w]) => {
            const pct = Math.round(((a as number) / (g as number)) * 100);
            return (
              <div key={n as string} className="glass rounded-3xl p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold">{n}</h3>
                  <span className="text-sm text-muted-foreground">{w}</span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground">${(a as number).toLocaleString()}</span> saved of ${(g as number).toLocaleString()} · {pct}% there</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 bg-secondary/60 py-28">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-xl text-4xl font-bold md:text-5xl">People who finally understand their money.</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              ["“For the first time, I know exactly what my bank charges me. Which is nothing I didn't expect.”", "Maya R.", "Designer, Toronto"],
              ["“I called support at 11pm and a real person helped me in two minutes. That's the whole review.”", "Daniel K.", "Nurse, Manchester"],
              ["“The savings goals made it feel easy. I've saved more this year than the last three combined.”", "Sofia L.", "Teacher, Valencia"],
            ].map(([q, n, r]) => (
              <figure key={n} className="glass rounded-3xl p-8">
                <div className="text-accent">★★★★★</div>
                <blockquote className="mt-4 text-lg leading-relaxed">{q}</blockquote>
                <figcaption className="mt-6 text-sm"><span className="font-semibold">{n}</span> <span className="text-muted-foreground">· {r}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-24 text-center">
        <h2 className="text-4xl font-bold md:text-6xl">Bring your money into the light.</h2>
        <a href="#" className="mt-8 inline-flex h-14 items-center rounded-full bg-primary px-10 font-semibold text-primary-foreground shadow-glow">{t.cta}</a>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 md:grid-cols-5">
          <div className="md:col-span-1">
            <p className="font-display text-lg font-bold">LUMEN</p>
            <p className="mt-2 text-sm text-muted-foreground">Transparent by design.</p>
          </div>
          {[
            ["Products", ["Current account", "Savings", "Cards", "Business"]],
            ["Support", ["Help centre", "Contact us", "Accessibility"]],
            ["Security", ["How we protect you", "Report fraud", "Deposit protection"]],
            ["Legal", ["Terms", "Privacy", "Cookies", "Fee schedule"]],
          ].map(([h, ls]) => (
            <div key={h as string}>
              <p className="text-sm font-semibold">{h}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(ls as string[]).map((l) => <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 border-t border-border px-5 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 Lumen Bank. All rights reserved.</p>
          <div className="flex gap-5">{["Instagram", "LinkedIn", "X", "YouTube"].map((s) => <a key={s} href="#" className="hover:text-foreground">{s}</a>)}</div>
        </div>
      </footer>
    </div>
  );
}

function Phone() {
  const [show, setShow] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const m = (v: string) => (show ? v : "••••");
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute -inset-10 rounded-full bg-glow blur-3xl" />
      <div className="relative rounded-[3rem] border-8 border-primary bg-background p-5 shadow-glow">
        <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-primary" />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Total balance</p>
          <button onClick={() => setShow(!show)} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{show ? "Hide" : "Show"}</button>
        </div>
        <p className="mt-1 font-display text-3xl font-bold">${m("12,480")}<span className="text-lg text-muted-foreground">{show ? ".52" : ""}</span></p>
        <div className="mt-4 rounded-2xl bg-secondary p-4">
          <div className="flex justify-between text-xs"><span className="font-semibold">Holiday goal</span><span className="text-muted-foreground">74%</span></div>
          <div className="mt-2 h-2 rounded-full bg-background"><div className="h-full w-3/4 rounded-full bg-gold" /></div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted p-4">
          <div><p className="text-xs text-muted-foreground">Card •• {show ? "4821" : "••••"}</p><p className="text-sm font-semibold">{frozen ? "Frozen" : "Active"}</p></div>
          <button onClick={() => setFrozen(!frozen)} aria-label="Toggle card freeze" className={`h-7 w-12 rounded-full p-1 transition ${frozen ? "bg-highlight" : "bg-accent"}`}>
            <span className={`block h-5 w-5 rounded-full bg-background transition ${frozen ? "translate-x-5" : ""}`} />
          </button>
        </div>
        <p className="mt-5 text-xs font-semibold">Recent</p>
        <ul className="mt-2 space-y-2 text-sm">
          {[["Corner Café", "-4.20"], ["Salary", "+3,200.00"], ["Metro Transit", "-2.75"]].map(([n, a]) => (
            <li key={n} className="flex justify-between"><span>{n}</span><span className={a.startsWith("+") ? "font-semibold text-highlight" : ""}>{show ? a : "••••"}</span></li>
          ))}
        </ul>
        <p className="mt-5 text-xs font-semibold">Spending this month</p>
        <div className="mt-2 flex h-16 items-end gap-1.5">
          {[40, 65, 30, 80, 55, 45, 70].map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-highlight/50" style={{ height: `${h}%` }} />)}
        </div>
      </div>
    </div>
  );
}

function Converter() {
  const [amt, setAmt] = useState(100);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const result = (amt / RATES[from].rate) * RATES[to].rate;
  const sel = (v: string, set: (s: string) => void, id: string) => (
    <select id={id} value={v} onChange={(e) => set(e.target.value)} className="h-14 w-full rounded-2xl border border-border bg-background px-4 font-medium">
      {Object.entries(RATES).map(([c, r]) => <option key={c} value={c}>{c} — {r.name}</option>)}
    </select>
  );
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5">
      <div className="glass grid gap-10 rounded-[2rem] p-8 md:grid-cols-2 md:p-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Currency conversion</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">The real rate. No markup.</h2>
          <p className="mt-4 text-muted-foreground">See exactly what you'll get before you send or spend abroad. The fee is always shown: 0.35%.</p>
        </div>
        <div className="space-y-3">
          <label htmlFor="amt" className="text-sm font-medium">You send</label>
          <div className="grid grid-cols-2 gap-3">
            <input id="amt" type="number" min={0} value={amt} onChange={(e) => setAmt(Number(e.target.value))} className="h-14 rounded-2xl border border-border bg-background px-4 text-lg font-semibold" />
            {sel(from, setFrom, "from")}
          </div>
          <label htmlFor="to" className="block pt-2 text-sm font-medium">They receive</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex h-14 items-center rounded-2xl bg-secondary px-4 text-lg font-semibold">{(result * 0.9965).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            {sel(to, setTo, "to")}
          </div>
          <p className="text-xs text-muted-foreground">1 {from} = {(RATES[to].rate / RATES[from].rate).toFixed(4)} {to} · indicative rate</p>
        </div>
      </div>
    </section>
  );
}
