import { Localized } from '@/components/localized';
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from '@/components/ui/button';
import { FAQ, PageHero, Shell, Stats } from "@/components/site";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Lumen Bank" },
      { name: "description", content: "Every Lumen Bank fee, listed up front in plain language. No hidden charges." },
      { property: "og:title", content: "Lumen Bank pricing" },
      { property: "og:description", content: "Honest, upfront pricing with no hidden fees." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const plans = [
  { name: "Essential", price: "$0", note: "forever", features: ["Current account & debit card", "Instant notifications", "Savings goals", "2 free ATM withdrawals / month"] },
  { name: "Plus", price: "$6", note: "per month", featured: true, features: ["Everything in Essential", "Unlimited free ATM withdrawals", "Higher savings rate (4.1%)", "Priority human support"] },
  { name: "Premier", price: "$15", note: "per month", features: ["Everything in Plus", "Metal card", "Travel insurance", "Fee-free currency exchange"] },
];

const fees = [
  ["Monthly account fee", "$0"], ["Card payments at home", "Free"], ["Card payments abroad", "Free"],
  ["Currency conversion", "0.35%"], ["ATM withdrawals beyond allowance", "$1.50"], ["Replacement card", "$5"], ["Overdraft", "We don't offer one"],
];

function Page() {
  return (
    <Localized><Shell>
      <PageHero eyebrow="Fees & Pricing" title="Fees & pricing, in plain sight." sub="If something costs money, you'll see it here—and in the app before you tap." />
      <section className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-3xl p-8 ${p.featured ? "bg-gold text-primary-foreground shadow-glow" : "glass"}`}>
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="mt-4"><span className="font-display text-5xl font-bold">{p.price}</span> <span className="opacity-75">{p.note}</span></p>
            <ul className="mt-6 space-y-3 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><span aria-hidden>✓</span>{f}</li>)}
            </ul>
            <Button asChild variant="outline" className={`mt-8 h-12 w-full rounded-full font-semibold ${p.featured ? "bg-background text-foreground" : "border-primary text-primary"}`}><Link to="/open-account">Choose {p.name}</Link></Button>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-3xl px-5 pt-24">
        <h2 className="text-3xl font-bold">Full fee schedule</h2>
        <table className="mt-8 w-full text-left">
          <caption className="sr-only">Lumen Bank fees</caption>
          <tbody>
            {fees.map(([k, v]) => (
              <tr key={k} className="border-b border-border">
                <th scope="row" className="py-4 font-medium">{k}</th>
                <td className="py-4 text-right font-semibold text-primary">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Stats items={[["$0", "monthly fee on Essential"], ["0%", "markup on card spending abroad"], ["0.35%", "flat currency conversion fee"], ["30 days", "notice before any price change"]]} />
      <FAQ items={[["Are there any hidden fees?", "No. Every fee we charge is listed on this page and shown in the app before you confirm a transaction."], ["Can I change plans?", "Yes. Upgrade or downgrade at any time from the app. Changes apply from your next billing date."], ["Will prices change?", "If we ever change a fee, we'll tell you at least 30 days in advance, and you can switch or close your account at no cost."], ["What happens if I cancel?", "There are no exit fees. We'll transfer your remaining balance to any account you choose."]]} />
    </Shell></Localized>
  );
}
