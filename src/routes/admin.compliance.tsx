import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { accounts, cards, cases, alerts, transactions, customerById, money } from "@/lib/admin-data";
import { DataPage, CustomerLink } from "@/components/admin/DataPage";
import { PageHeader, Panel, StatusBadge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/compliance")({
  head: () => ({ meta: [{ title: "Compliance — Lumen Bank Admin" }, { name: "description", content: "Compliance alerts and reviews." }] }),
  component: Page,
});

function Page() {
  const n = (id: string) => customerById(id)?.name ?? id;
  return <DataPage title="Compliance" crumb="Compliance" sub="Alerts sorted by urgency. Urgent items should be reviewed today." rows={alerts}
    filters={["Urgent", "Needs attention", "Informational"]} filterKey={(r) => r.level}
    cols={[
      { label: "Alert", cell: (r) => <><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.detail}</p></>, text: (r) => r.title + r.detail },
      { label: "Customer", cell: (r) => <CustomerLink id={r.customer} name={n(r.customer)} />, text: (r) => n(r.customer) },
      { label: "Level", cell: (r) => <StatusBadge s={r.level} /> },
      { label: "Raised", cell: (r) => <span className="text-muted-foreground">{r.time}</span> },
      { label: "Action", right: true, cell: (r) => <button className="font-semibold text-primary" onClick={() => toast.success(`${r.id} marked as reviewed`, { action: { label: "Undo", onClick: () => toast("Review undone") } })}>Mark reviewed</button> },
    ]} />;
}
