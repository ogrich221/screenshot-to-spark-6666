import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { accounts, cards, cases, alerts, transactions, customerById, money } from "@/lib/admin-data";
import { DataPage, CustomerLink } from "@/components/admin/DataPage";
import { PageHeader, Panel, StatusBadge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/cases")({
  head: () => ({ meta: [{ title: "Support cases — Lumen Bank Admin" }, { name: "description", content: "Customer support queue." }, { property: "og:title", content: "Support cases — Lumen Bank Admin" }, { property: "og:description", content: "Customer support queue." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  const n = (id: string) => customerById(id)?.name ?? id;
  return <DataPage title="Support cases" crumb="Support cases" sub="The customer queue, most urgent first. Average wait today: 2 minutes." rows={cases}
    filters={["Open", "Waiting on customer", "Resolved"]} filterKey={(r) => r.status}
    actions={<button className={btnPrimary} onClick={() => toast.success("Case CS-419 created", { action: { label: "Undo", onClick: () => toast("Case removed") } })}>Create case</button>}
    cols={[
      { label: "Case", cell: (r) => <><p className="font-medium">{r.subject}</p><p className="text-xs text-muted-foreground">{r.id} · updated {r.updated}</p></>, text: (r) => r.subject + r.id },
      { label: "Customer", cell: (r) => <CustomerLink id={r.customer} name={n(r.customer)} />, text: (r) => n(r.customer) },
      { label: "Priority", cell: (r) => <StatusBadge s={r.priority} /> },
      { label: "Status", cell: (r) => <StatusBadge s={r.status} /> },
      { label: "Owner", right: true, cell: (r) => r.owner },
    ]} />;
}
