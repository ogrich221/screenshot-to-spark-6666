import { createFileRoute } from "@tanstack/react-router";
import { FAQ, Features, PageHero, Shell, Stats } from "@/components/site";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: 'Business banking — Lumen Bank' },
      { name: "description", content: 'Business accounts with clear pricing, team cards, invoicing and accounting integrations.' },
      { property: "og:title", content: 'Business banking — Lumen Bank' },
      { property: "og:description", content: 'Business accounts with clear pricing, team cards, invoicing and accounting integrations.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Shell>
      <PageHero eyebrow={'Business'} title={'Business banking, without the paperwork.'} sub={'Open a business account online, give your team cards, and see your cash flow clearly.'} />
      <Features items={[['Open online', 'Sole traders and limited companies can apply in about ten minutes.'], ['Team cards', 'Issue cards to employees with individual limits and real-time receipts.'], ['Invoicing', 'Create and send invoices, and get paid straight into your account.'], ['Accounting sync', 'Connect to Xero, QuickBooks and FreeAgent automatically.'], ['Bulk payments', 'Pay suppliers and staff in one batch upload.'], ['Dedicated manager', 'Growing businesses get a named relationship manager.']]} />
      <Stats items={[['10 min', 'to apply'], ['$0', 'Starter plan'], ['40,000+', 'businesses on Lumen'], ['3', 'accounting integrations']]} />
      <FAQ items={[['Who can open a business account?', 'Sole traders, freelancers and registered companies in supported countries.'], ['What does it cost?', 'Starter is free. Grow is $12 a month and Scale is $39 a month, with fees listed on our pricing page.'], ['Can I add co-owners?', 'Yes. Invite directors and accountants with their own permissions.']]} />
    </Shell>
  );
}
