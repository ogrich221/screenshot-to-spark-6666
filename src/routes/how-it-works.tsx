import { createFileRoute } from "@tanstack/react-router";
import { FAQ, PageHero, Shell, Stats } from "@/components/site";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Lumen Bank" },
      { name: "description", content: "Open a Lumen account in minutes and see every payment, fee and balance in real time." },
      { property: "og:title", content: "How Lumen Bank works" },
      { property: "og:description", content: "Open in minutes. See everything. Stay in control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <PageHero eyebrow="Personal Banking" title="Personal banking, designed around you." sub="Four simple steps. No jargon, no fine print, no waiting on hold." />
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
      <Stats items={[["5 min", "average account opening"], ["0", "branch visits required"], ["24/7", "in-app human support"], ["150+", "countries your card works in"]]} />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pt-24 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold md:text-4xl">One account. Everything you need.</h2>
          <p className="mt-4 text-muted-foreground">Your Lumen current account comes with local account details, a contactless debit card, Apple Pay and Google Pay support, direct debits, standing orders and instant transfers—at no monthly cost.</p>
        </div>
        <ul className="space-y-4">
          {["Get paid up to two days early", "Split bills and request money from friends", "Hold and spend in 15 currencies", "Download statements any time, in PDF or CSV"].map((x) => (
            <li key={x} className="flex gap-3 rounded-2xl bg-secondary p-4"><span aria-hidden className="text-primary">✓</span>{x}</li>
          ))}
        </ul>
      </section>
      <FAQ items={[["Who can open an account?", "Anyone aged 18 or over with a valid passport or national ID and a residential address in a supported country."], ["Is there a minimum deposit?", "No. You can open your account with a zero balance and add money whenever you're ready."], ["Can I switch my salary to Lumen?", "Yes. Share your new account details with your employer, or use our switching service and we'll move your payments for you."], ["How do I contact support?", "Tap Help in the app to chat with a real person, any time of day. You can also call us on the number printed on your card."]]} />
    </Shell>
  );
}
