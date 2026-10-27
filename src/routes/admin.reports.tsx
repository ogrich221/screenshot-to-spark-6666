import { Localized } from '@/components/localized';
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { accounts, cards, cases, alerts, transactions, customerById, money } from "@/lib/admin-data";
import { DataPage, CustomerLink } from "@/components/admin/DataPage";
import { PageHeader, Panel, StatusBadge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Lumen Bank Admin" }, { name: "description", content: "Downloadable operational reports." }, { property: "og:title", content: "Reports — Lumen Bank Admin" }, { property: "og:description", content: "Downloadable operational reports." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  const reports = [["Daily operations summary", "Customers, accounts, volume and queue", "Daily · 07:00"], ["Transaction volume by currency", "Totals across all 15 supported currencies", "Weekly"], ["Compliance review log", "Every alert and who reviewed it", "Monthly"], ["Support performance", "Wait times, resolution and satisfaction", "Weekly"], ["New accounts", "Openings by segment and country", "Monthly"], ["Card activity", "Freezes, replacements and limits", "Weekly"]];
  const bars = [62, 70, 58, 81, 76, 90, 84];
  return (
    <Localized><>
      <PageHeader crumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Reports" }]} back={{ label: "Back to dashboard", to: "/admin" }} title="Reports" sub="Clear, ready-made reports. Download as CSV or PDF." />
      <Panel title="Transaction volume, last 7 days" help="Total value moved each day, in millions of US dollars." className="mb-6">
        <div className="flex h-40 items-end gap-3">
          {bars.map((b, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-xl bg-gold" style={{ height: `${b}%` }} /><span className="text-xs text-muted-foreground">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</span></div>)}
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(([t, d, f]) => (
          <Panel key={t}>
            <p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p><p className="mt-3 text-xs text-primary">{f}</p>
            <div className="mt-4 flex gap-2"><button className={btnGhost} onClick={() => toast.success(`${t} (CSV) downloading`)}>CSV</button><button className={btnGhost} onClick={() => toast.success(`${t} (PDF) downloading`)}>PDF</button></div>
          </Panel>
        ))}
      </div>
    </></Localized>
  );
}
