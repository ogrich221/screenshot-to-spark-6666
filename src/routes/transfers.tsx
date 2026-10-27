import { Localized } from '@/components/localized';
import { createFileRoute } from "@tanstack/react-router";
import { FAQ, Features, PageHero, Shell, Stats } from "@/components/site";

export const Route = createFileRoute("/transfers")({
  head: () => ({
    meta: [
      { title: 'Transfers — Lumen Bank' },
      { name: "description", content: 'Send money at home instantly and abroad at the real exchange rate, with the fee shown up front.' },
      { property: "og:title", content: 'Transfers — Lumen Bank' },
      { property: "og:description", content: 'Send money at home instantly and abroad at the real exchange rate, with the fee shown up front.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Localized><Shell>
      <PageHero eyebrow={'Transfers'} title={'Send money, see every cent.'} sub={"Instant local payments and low-cost international transfers—with the exact amount they'll receive shown before you send."} />
      <Features items={[['Instant local transfers', 'Money arrives in seconds, 24 hours a day, every day of the year.'], ['International payments', 'Send to 40+ countries at the real exchange rate, plus a flat 0.35% fee.'], ['Scheduled payments', 'Set up standing orders and future-dated payments in a few taps.'], ['Request money', 'Send a payment link to friends to split bills easily.'], ['Payee confirmation', 'We check the name matches the account before you send.'], ['Live tracking', 'Follow every international transfer until it lands.']]} />
      <Stats items={[['Seconds', 'for local transfers'], ['$5M', 'daily limit (T&Cs apply)'], ['0.35%', 'international fee'], ['$0', 'local transfer fee']]} />
      <FAQ items={[['How long do international transfers take?', 'Most arrive within one working day. Some arrive in minutes.'], ['Is there a transfer limit?', 'You can send up to $5,000,000 a day. Terms and conditions apply.'], ['Can I cancel a transfer?', 'Scheduled transfers can be cancelled any time before they go out.']]} />
    </Shell></Localized>
  );
}
