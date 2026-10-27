import { createFileRoute } from "@tanstack/react-router";
import { FAQ, Features, PageHero, Shell, Stats } from "@/components/site";

export const Route = createFileRoute("/loans")({
  head: () => ({
    meta: [
      { title: 'Loans — Lumen Bank' },
      { name: "description", content: 'Personal loans with a fixed rate, no early repayment fees and a decision in minutes.' },
      { property: "og:title", content: 'Loans — Lumen Bank' },
      { property: "og:description", content: 'Personal loans with a fixed rate, no early repayment fees and a decision in minutes.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Shell>
      <PageHero eyebrow={'Loans'} title={'Borrow with your eyes open.'} sub={'Fixed rates, a clear monthly cost, and no penalty for paying back early.'} />
      <Features items={[['Check your rate', 'See your personal rate in two minutes, without affecting your credit score.'], ['Fixed repayments', 'Your monthly payment never changes for the life of the loan.'], ['No early repayment fees', 'Pay off part or all of your loan whenever you like.'], ['Fast decisions', 'Most applications are decided in minutes, with funds the same day.'], ['Clear total cost', "We show the full amount you'll repay before you agree."], ['Payment holidays', 'Hit a rough patch? Talk to us about pausing a payment.']]} />
      <Stats items={[['From 5.5%', 'APR representative'], ['$1K–$35K', 'borrowing range'], ['1–7 years', 'loan terms'], ['$0', 'early repayment fee']]} />
      <FAQ items={[['Will checking my rate affect my credit score?', 'No. We use a soft search, which only you can see.'], ['What can I use a loan for?', 'Home improvements, a car, consolidating debt or other personal purchases.'], ['What if I miss a payment?', "Contact us as soon as you can. We'll work with you on a plan before charging anything."]]} />
    </Shell>
  );
}
