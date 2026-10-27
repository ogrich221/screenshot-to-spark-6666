import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { customers } from "@/lib/admin-data";
import { Empty, PageHeader, Panel, StatusBadge, btnGhost, input } from "@/components/admin/ui";

type S = { q?: string | undefined; status?: string | undefined; segment?: string | undefined };

export const Route = createFileRoute("/admin/customers/")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    status: typeof s["status"] === "string" && s["status"] !== "All" ? s["status"] : undefined,
    segment: typeof s["segment"] === "string" && s["segment"] !== "All" ? s["segment"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Customers — Lumen Bank Admin" }, { name: "description", content: "Search and filter Lumen Bank customers." }, { property: "og:title", content: "Customers — Lumen Bank Admin" }, { property: "og:description", content: "Search and filter Lumen Bank customers." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Customers,
});

const VIEWS: [string, S][] = [["All customers", {}], ["Needs review", { status: "Review needed" }], ["Restricted", { status: "Temporarily restricted" }], ["Premier", { segment: "Premier" }]];

function Customers() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/customers/" });
  const set = (patch: Partial<S>) => navigate({ search: (p) => ({ ...p, ...patch }), replace: true });
  const q = (search.q ?? "").toLowerCase();
  const rows = customers.filter((c) =>
    (!q || [c.name, c.email, c.id, c.country].some((v) => v.toLowerCase().includes(q))) &&
    (!search.status || c.status === search.status) && (!search.segment || c.segment === search.segment));

  return (
    <>
      <PageHeader crumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Customers" }]} back={{ label: "Back to dashboard", to: "/admin" }}
        title="Customers" sub="Find anyone by name, email, ID or country. Your filters stay in place when you come back." />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Saved views">
        {VIEWS.map(([label, v]) => {
          const active = (v.status ?? undefined) === search.status && (v.segment ?? undefined) === search.segment;
          return <button key={label} role="tab" aria-selected={active} onClick={() => navigate({ search: { q: search.q, status: v.status, segment: v.segment } })}
            className={`h-10 rounded-full px-4 text-sm font-medium ${active ? "bg-gold text-primary-foreground" : "border border-border hover:border-primary"}`}>{label}</button>;
        })}
      </div>
      <Panel>
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="cq" className="sr-only">Search</label>
            <input id="cq" value={search.q ?? ""} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Search by name, email, ID…" className={`${input} w-full pl-11`} />
          </div>
          <label className="sr-only" htmlFor="st">Status</label>
          <select id="st" value={search.status ?? "All"} onChange={(e) => set({ status: e.target.value })} className={input}>
            {["All", "Verified", "Review needed", "Temporarily restricted", "Closed"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <label className="sr-only" htmlFor="sg">Segment</label>
          <select id="sg" value={search.segment ?? "All"} onChange={(e) => set({ segment: e.target.value })} className={input}>
            {["All", "Personal", "Premier", "Business"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {rows.length === 0 ? (
          <Empty title="No customers match" text="Try a different name or clear your filters to see everyone." action={<button className={btnGhost} onClick={() => navigate({ search: {} })}>Clear filters</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3">Customer</th><th className="p-3">Segment</th><th className="p-3">Country</th><th className="p-3">Risk</th><th className="p-3">Status</th><th className="p-3 text-right">Joined</th></tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-secondary/60">
                    <td className="p-3">
                      <Link to="/admin/customers/$id" params={{ id: c.id }} className="font-medium hover:text-primary">{c.name}</Link>
                      <p className="text-xs text-muted-foreground">{c.email} · {c.id}</p>
                    </td>
                    <td className="p-3">{c.segment}</td><td className="p-3">{c.country}</td>
                    <td className="p-3"><StatusBadge s={c.risk} /></td><td className="p-3"><StatusBadge s={c.status} /></td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">{c.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground">Showing {rows.length} of {customers.length} customers</p>
      </Panel>
    </>
  );
}
