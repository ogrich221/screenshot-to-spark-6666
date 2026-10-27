import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Download, FolderPlus, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { activity, alerts } from "@/lib/admin-data";
import { PageHeader, Panel, StatusBadge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Overview — Lumen Bank Admin" }, { name: "description", content: "Daily summary of customers, accounts, reviews and alerts." }] }),
  component: Overview,
});

const kpis = [
  { label: "Total customers", value: "2,148,320", trend: "+1.8%", up: true, note: "12,410 new customers this month" },
  { label: "Active accounts", value: "3,902,115", trend: "+0.9%", up: true, note: "Accounts used in the last 30 days" },
  { label: "Pending reviews", value: "184", trend: "-12%", up: false, note: "Identity and document checks waiting" },
  { label: "Transaction volume", value: "$412.6M", trend: "+4.2%", up: true, note: "Total moved today across all accounts" },
  { label: "Support queue", value: "37", trend: "-8%", up: false, note: "Open cases, average wait 2 minutes" },
  { label: "Urgent alerts", value: String(alerts.filter((a) => a.level === "Urgent").length), trend: "Review now", up: true, note: "Compliance items needing action today", urgent: true },
];

function Overview() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <>
      <PageHeader crumbs={[{ label: "Dashboard" }]} title={`${greet}, Alex`} sub="Here's what's happening across Lumen Bank today. Everything that needs you is at the top."
        actions={<>
          <Link to="/admin/customers" className={btnGhost}><Search className="h-4 w-4" />Find customer</Link>
          <Link to="/admin/compliance" className={btnGhost}><ShieldCheck className="h-4 w-4" />Review alert</Link>
          <Link to="/admin/cases" className={btnGhost}><FolderPlus className="h-4 w-4" />Create case</Link>
          <button onClick={() => toast.success("Daily summary exported", { description: "lumen-daily-summary.csv is downloading." })} className={btnPrimary}><Download className="h-4 w-4" />Export report</button>
        </>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className={`glass rounded-3xl p-5 ${k.urgent ? "ring-1 ring-destructive/50" : ""}`}>
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <p className="font-display text-3xl font-bold tabular-nums">{k.value}</p>
              <span className={`inline-flex items-center gap-1 text-sm font-semibold ${k.urgent ? "text-destructive" : "text-success"}`}>
                {!k.urgent && (k.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />)}{k.trend}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{k.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel title="Alerts" help="Urgent items need action today. Needs attention can wait until end of day." className="lg:col-span-3" action={<Link to="/admin/compliance" className="text-sm font-semibold text-primary">View all</Link>}>
          {(["Urgent", "Needs attention", "Informational"] as const).map((lvl) => {
            const list = alerts.filter((a) => a.level === lvl);
            return (
              <div key={lvl} className="mb-4 last:mb-0">
                <div className="mb-2"><StatusBadge s={lvl} /></div>
                <ul className="space-y-2">
                  {list.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary p-4">
                      <div className="min-w-0"><p className="font-medium">{a.title}</p><p className="text-sm text-muted-foreground">{a.detail}</p></div>
                      <Link to="/admin/customers/$id" params={{ id: a.customer }} className="text-sm font-semibold text-primary">Open customer →</Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </Panel>
        <Panel title="Recent activity" className="lg:col-span-2">
          <ol className="relative space-y-5 border-l border-border pl-5">
            {activity.map((a, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                <p className="text-xs text-muted-foreground">{a.time} · {a.kind}</p>
                <p className="mt-0.5 text-sm">{a.text}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}
