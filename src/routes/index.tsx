import { Localized } from '@/components/localized';
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Shell, useT } from "@/components/site";
import building from "@/assets/bank-building.jpg";
import staffDesk from "@/assets/staff-desk.jpg";
import manager from "@/assets/branch-manager.jpg";
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen Bank — Banking, clearly." },
      { name: "description", content: "Simple accounts, transparent fees, and complete control over your money. Lumen Bank: transparent by design." },
      { property: "og:title", content: "Lumen Bank — Banking, clearly." },
      { property: "og:description", content: "Simple accounts, transparent fees, and complete control over your money." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

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
  const { t } = useT();
  return (
    <Localized><Shell>
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0">
        <img src={building} alt="Lumen Bank headquarters at dusk" width={1920} height={1088} className="h-auto w-full opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
      </div>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-[52vw] md:grid-cols-2 md:pt-[22vw]">
        <div>
          <span className="glass inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transparent by design</span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.02] md:text-7xl text-gold">{t.h}</h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">{t.sub}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-14 rounded-full bg-gold px-8 font-semibold shadow-glow transition hover:-translate-y-0.5"><Link to="/open-account">{t.cta}</Link></Button>
            <Link to="/how-it-works" className="glass inline-flex h-14 items-center justify-center rounded-full px-8 font-semibold">{t.cta2} →</Link>
          </div>
          <Globe />
          <p className="mt-4 text-sm text-muted-foreground">Already a customer? <Link to="/auth" className="font-semibold text-primary hover:underline">Sign in</Link></p>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {[["2M+", "customers"], ["$0", "monthly fee"], ["4.9★", "app rating"]].map(([v, l]) => (
              <div key={l}><dt className="font-display text-2xl font-bold text-primary">{v}</dt><dd className="text-sm text-muted-foreground">{l}</dd></div>
            ))}
          </dl>
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
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">How transparency works</p>
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
        <Link to="/how-it-works" className="mt-10 inline-flex font-semibold text-primary hover:underline">See the full walkthrough →</Link>
      </section>

      <Converter />

      {/* People */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Real people, real branches</p>
        <h2 className="mt-3 max-w-2xl text-4xl font-bold md:text-5xl">Digital first. <span className="text-gold">Never faceless.</span></h2>
        <div className="mt-14 grid gap-6 md:grid-cols-5">
          <figure className="relative overflow-hidden rounded-[2rem] border border-border md:col-span-3">
            <img src={staffDesk} alt="Lumen Bank advisor processing a customer payment at the branch desk" loading="lazy" width={1264} height={848} className="h-full w-full object-cover" />
            <figcaption className="absolute inset-x-4 bottom-4 rounded-2xl border border-border bg-background/80 p-5 backdrop-blur-xl">
              <p className="font-semibold">Payments handled in minutes</p>
              <p className="mt-1 text-sm text-muted-foreground">Our advisors process deposits, transfers and bills while you watch every step.</p>
            </figcaption>
          </figure>
          <figure className="relative overflow-hidden rounded-[2rem] border border-border md:col-span-2">
            <img src={manager} alt="Lumen Bank branch manager welcoming customers" loading="lazy" width={1024} height={1024} className="h-full w-full object-cover" />
            <figcaption className="absolute inset-x-4 bottom-4 rounded-2xl border border-border bg-background/80 p-5 backdrop-blur-xl">
              <p className="font-semibold">A manager who knows your name</p>
              <p className="mt-1 text-sm text-muted-foreground">Walk in, sit down, and get honest advice from someone on your side.</p>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 bg-secondary/40 py-28">
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

    </div>
    </Shell></Localized>
  );
}

function Phone() {
  const [show, setShow] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const m = (v: string) => (show ? v : "••••");
  return (
    <Localized><div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute -inset-10 rounded-full bg-glow blur-3xl" />
      <div className="relative rounded-[3rem] border-8 border-secondary bg-background ring-1 ring-primary/40 p-5 shadow-glow">
        <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-secondary" />
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
            <li key={n} className="flex justify-between"><span>{n}</span><span className={a!.startsWith("+") ? "font-semibold text-primary" : ""}>{show ? a : "••••"}</span></li>
          ))}
        </ul>
        <p className="mt-5 text-xs font-semibold">Spending this month</p>
        <div className="mt-2 flex h-16 items-end gap-1.5">
          {[40, 65, 30, 80, 55, 45, 70].map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-highlight/50" style={{ height: `${h}%` }} />)}
        </div>
      </div>
    </div></Localized>
  );
}

function Converter() {
  const [amt, setAmt] = useState(100);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const result = (amt / RATES[from]!.rate) * RATES[to]!.rate;
  const sel = (v: string, set: (s: string) => void, id: string) => (
    <select id={id} value={v} onChange={(e) => set(e.target.value)} className="h-14 w-full rounded-2xl border border-border bg-background px-4 font-medium">
      {Object.entries(RATES).map(([c, r]) => <option key={c} value={c}>{c} — {r.name}</option>)}
    </select>
  );
  return (
    <Localized><section className="relative z-10 mx-auto max-w-6xl px-5">
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
          <p className="text-xs text-muted-foreground">1 {from} = {(RATES[to]!.rate / RATES[from]!.rate).toFixed(4)} {to} · indicative rate</p>
        </div>
      </div>
    </section></Localized>
  );
}
