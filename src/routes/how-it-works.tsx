import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Shell } from "@/components/site";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Lumen Bank" },
      { name: "description", content: "Open a Lumen account in minutes and see every payment, fee and balance in real time." },
      { property: "og:title", content: "How Lumen Bank works" },
      { property: "og:description", content: "Open in minutes. See everything. Stay in control." },
    ],
  }),
  component: Page,
});

const steps = [
  ["Download & sign up", "Get the app and enter a few details. It takes about five minutes, with no branch visits and no paperwork."],
  ["Verify your identity", "Take a photo of your ID and a quick selfie. We confirm it's you, usually in under two minutes."],
  ["Get your card", "Your virtual card is ready instantly for online and phone payments. The physical card arrives in 3–5 days."],
  ["Bank in the light", "Every payment appears the moment it happens, with the merchant, the category and your new balance."],
];

function Page() {
  return (
    <Shell>
      <PageHero eyebrow="How it works" title="From sign-up to spending in one coffee break." sub="Four simple steps. No jargon, no fine print, no waiting on hold." />
      <section className="mx-auto max-w-6xl px-5">
        <ol className="grid gap-6 md:grid-cols-2">
          {steps.map(([h, p], i) => (
            <li key={h} className="glass rounded-3xl p-8">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gold font-display font-bold text-primary-foreground">{i + 1}</span>
              <h2 className="mt-6 text-2xl font-semibold">{h}</h2>
              <p className="mt-3 text-muted-foreground">{p}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="mx-auto max-w-6xl px-5 pt-24">
        <h2 className="text-3xl font-bold md:text-4xl">Everyday control, built in</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[["Instant alerts", "A notification for every payment, every time."], ["Freeze in one tap", "Lost your card? Lock it, then unlock it when you find it."], ["Spending limits", "Set daily caps for shopping, cash or online purchases."], ["Smart categories", "See where your money goes, in plain words."]].map(([h, p]) => (
            <div key={h} className="rounded-3xl border border-border p-6">
              <h3 className="text-lg font-semibold text-primary">{h}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p}</p>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
