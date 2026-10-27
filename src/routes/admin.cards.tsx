import { Localized } from '@/components/localized';
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { accounts, cards, cases, alerts, transactions, customerById, money } from "@/lib/admin-data";
import { DataPage, CustomerLink } from "@/components/admin/DataPage";
import { PageHeader, Panel, StatusBadge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/cards")({
  head: () => ({ meta: [{ title: "Cards — Lumen Bank Admin" }, { name: "description", content: "Card status, limits and controls." }, { property: "og:title", content: "Cards — Lumen Bank Admin" }, { property: "og:description", content: "Card status, limits and controls." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  const n = (id: string) => customerById(id)?.name ?? id;
  return <Localized><DataPage title="Cards" crumb="Cards" sub="Freeze, limit or replace cards. Every change is logged and reversible." rows={cards}
    filters={["Active", "Frozen", "Cancelled"]} filterKey={(r) => r.status}
    cols={[
      { label: "Card", cell: (r) => <><p className="font-medium">{r.type}</p><p className="text-xs text-muted-foreground">•••• {r.last4} · exp {r.expires}</p></>, text: (r) => r.type + r.last4 },
      { label: "Customer", cell: (r) => <CustomerLink id={r.customer} name={n(r.customer)} />, text: (r) => n(r.customer) },
      { label: "Status", cell: (r) => <StatusBadge s={r.status} /> },
      { label: "Daily limit", right: true, cell: (r) => money(r.limit, "USD") },
      { label: "Action", right: true, cell: (r) => r.status === "Cancelled" ? <span className="text-muted-foreground">—</span> :
        <button className="font-semibold text-primary" onClick={() => toast.success(r.status === "Frozen" ? "Card unfrozen" : "Card frozen", { action: { label: "Undo", onClick: () => toast("Change undone") } })}>{r.status === "Frozen" ? "Unfreeze" : "Freeze"}</button> },
    ]} /></Localized>;
}
