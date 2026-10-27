import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { accounts, cards, cases, alerts, transactions, customerById, money } from "@/lib/admin-data";
import { DataPage, CustomerLink } from "@/components/admin/DataPage";
import { PageHeader, Panel, StatusBadge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Lumen Bank Admin" }, { name: "description", content: "Every payment across Lumen Bank in real time." }, { property: "og:title", content: "Transactions — Lumen Bank Admin" }, { property: "og:description", content: "Every payment across Lumen Bank in real time." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  const n = (id: string) => customerById(id)?.name ?? id;
  return <DataPage title="Transactions" crumb="Transactions" sub="Every payment as it happens. Flagged items need a quick review." rows={transactions}
    filters={["Completed", "Pending", "Flagged", "Reversed"]} filterKey={(r) => r.status}
    actions={<button className={btnGhost} onClick={() => toast.success("Transactions exported")}>Export CSV</button>}
    cols={[
      { label: "Date", cell: (r) => <span className="tabular-nums text-muted-foreground">{r.date}</span> },
      { label: "Description", cell: (r) => <span className="font-medium">{r.description}</span>, text: (r) => r.description },
      { label: "Customer", cell: (r) => <CustomerLink id={r.customer} name={n(r.customer)} />, text: (r) => n(r.customer) },
      { label: "Status", cell: (r) => <StatusBadge s={r.status} /> },
      { label: "Amount", right: true, cell: (r) => <span className={`font-semibold ${r.amount > 0 ? "text-success" : ""}`}>{money(r.amount, r.currency)}</span> },
    ]} />;
}
