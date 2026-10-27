import { createFileRoute } from "@tanstack/react-router";
import { FAQ, Features, PageHero, Shell, Stats } from "@/components/site";

export const Route = createFileRoute("/cards")({
  head: () => ({
    meta: [
      { title: 'Cards — Lumen Bank' },
      { name: "description", content: 'Contactless debit and metal cards with instant freeze, spending limits and zero fees abroad.' },
      { property: "og:title", content: 'Cards — Lumen Bank' },
      { property: "og:description", content: 'Contactless debit and metal cards with instant freeze, spending limits and zero fees abroad.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Shell>
      <PageHero eyebrow={'Cards'} title={'Cards that answer to you.'} sub={'Freeze, limit and track every card from your phone—at home or abroad.'} />
      <Features items={[['Instant virtual card', 'Start spending online the moment your account opens, before the physical card arrives.'], ['Freeze & unfreeze', 'Misplaced your card? Lock it in one tap and unlock it when it turns up.'], ['Spending limits', 'Set daily caps for in-store, online and cash withdrawals.'], ['Disposable cards', 'Generate single-use card numbers for safer online shopping.'], ['Apple Pay & Google Pay', 'Add your card to your phone or watch in seconds.'], ['Metal card', 'Premier customers get a weighted metal card with gold detailing.']]} />
      <Stats items={[['0%', 'markup abroad'], ['1 tap', 'to freeze a card'], ['3–5 days', 'physical card delivery'], ['150+', 'countries accepted']]} />
      <FAQ items={[['How much does a card cost?', 'Your first debit card is free. Replacements cost $5, and the metal card is included with Premier.'], ['Can I use my card abroad?', 'Yes. Spend in 150+ countries with no markup on the exchange rate.'], ['How do I change my PIN?', 'View or change your PIN securely in the app, under Card settings.']]} />
    </Shell>
  );
}
