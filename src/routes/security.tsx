import { createFileRoute } from "@tanstack/react-router";
import { FAQ, PageHero, Shell, Stats } from "@/components/site";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — Lumen Bank" },
      { name: "description", content: "How Lumen Bank protects your money and data: encryption, deposit protection, fraud monitoring and human support." },
      { property: "og:title", content: "Lumen Bank security" },
      { property: "og:description", content: "Bank-grade security, explained in plain language." },
    ],
  }),
  component: Page,
});

const items = [
  ["Deposit protection", "Eligible deposits are protected up to $250,000 per customer."],
  ["Encryption everywhere", "Your data is encrypted in transit and at rest, using the same standards as major banks."],
  ["24/7 fraud monitoring", "We watch for unusual activity around the clock and alert you instantly."],
  ["Biometric login", "Unlock with your face or fingerprint. Nobody else gets in."],
  ["Card controls", "Freeze, unfreeze, or block online payments in a single tap."],
  ["Real people", "Talk to a human support specialist, day or night, in minutes."],
];

function Page() {
  return (
    <Shell>
      <PageHero eyebrow="Security Centre" title="Protected, always—and you'll always know how." sub="We explain every safeguard in plain words—because trust shouldn't need a dictionary." />
      <section className="mx-auto grid max-w-6xl gap-6 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([h, p]) => (
          <div key={h} className="glass rounded-3xl p-8">
            <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">◈</span>
            <h2 className="mt-5 text-xl font-semibold">{h}</h2>
            <p className="mt-2 text-muted-foreground">{p}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-3xl px-5 pt-24">
        <div className="rounded-3xl border border-primary/40 p-8">
          <h2 className="text-2xl font-semibold">Think something's wrong?</h2>
          <p className="mt-3 text-muted-foreground">Freeze your card in the app straight away, then message us. We'll never ask for your PIN or passcode.</p>
          <a href="#" className="mt-6 inline-flex h-12 items-center rounded-full bg-gold px-6 font-semibold text-primary-foreground">Report fraud</a>
        </div>
      </section>
      <Stats items={[["$250K", "deposit protection"], ["24/7", "fraud monitoring"], ["256-bit", "encryption"], ["< 2 min", "average support response"]]} />
      <FAQ items={[["What should I do if my card is lost?", "Freeze it instantly in the app. If it doesn't turn up, order a replacement in one tap and we'll cancel the old one."], ["Will Lumen ever call me to ask for my PIN?", "Never. We will never ask for your PIN, passcode or one-time codes by phone, email or message."], ["How do you protect my personal data?", "We encrypt your data, never sell it, and only share it when the law requires us to."], ["What if I'm charged for something I didn't buy?", "Report it in the app. We'll investigate and, in most cases, refund you while we look into it."]]} />
    </Shell>
  );
}
