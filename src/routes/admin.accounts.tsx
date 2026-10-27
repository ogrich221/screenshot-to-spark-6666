import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { accounts, cards, cases, alerts, transactions, customerById, money } from "@/lib/admin-data";
import { DataPage, CustomerLink } from "@/components/admin/DataPage";
import { PageHeader, Panel, StatusBadge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/accounts")({
  head: () => ({ meta: [{ title: "Accounts — Lumen Bank Admin" }, { name: "description", content: "Account balances, restrictions and status." }] }),
  component: Page,
});

function Page() {
  const n = (id: string) => customerById(id)?.name ?? id;
  return <DataPage title="Accounts" crumb="Accounts" sub="Balances, restrictions and verification at a glance." rows={accounts}
    filters={["Verified", "Review needed", "Temporarily restricted", "Closed"]} filterKey={(r) => r.status}
    cols={[
      { label: "Account", cell: (r) => <><p className="font-medium">{r.type}</p><p className="text-xs text-muted-foreground">{r.number}</p></>, text: (r) => r.type + r.number },
      { label: "Customer", cell: (r) => <CustomerLink id={r.customer} name={n(r.customer)} />, text: (r) => n(r.customer) },
      { label: "Restrictions", cell: (r) => <span className="text-muted-foreground">{r.restriction}</span> },
      { label: "Status", cell: (r) => <StatusBadge s={r.status} /> },
      { label: "Balance", right: true, cell: (r) => <span className="font-semibold">{money(r.balance, r.currency)}</span> },
    ]} />;
}
