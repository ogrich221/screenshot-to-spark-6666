import { Localized } from '@/components/localized';
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Empty, PageHeader, Panel, btnGhost, input } from "./ui";

export type Col<T> = { label: string; cell: (r: T) => ReactNode; right?: boolean; text?: (r: T) => string };

export function DataPage<T>({ title, crumb, sub, rows, cols, filters, filterKey, actions, above }: {
  title: string; crumb: string; sub: string; rows: T[]; cols: Col<T>[];
  filters?: string[]; filterKey?: (r: T) => string; actions?: ReactNode; above?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");
  const list = rows.filter((r) =>
    (!q || cols.some((c) => (c.text?.(r) ?? "").toLowerCase().includes(q.toLowerCase()))) &&
    (f === "All" || filterKey?.(r) === f));
  return (
    <Localized><>
      <PageHeader crumbs={[{ label: "Dashboard", to: "/admin" }, { label: crumb }]} back={{ label: "Back to dashboard", to: "/admin" }} title={title} sub={sub} actions={actions} />
      {above}
      <Panel>
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label className="sr-only" htmlFor="dq">Search</label>
            <input id="dq" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className={`${input} w-full pl-11`} />
          </div>
          {filters && (
            <div className="flex flex-wrap gap-2">
              {["All", ...filters].map((x) => (
                <button key={x} onClick={() => setF(x)} aria-pressed={f === x} className={`h-11 rounded-full px-4 text-sm font-medium ${f === x ? "bg-gold text-primary-foreground" : "border border-border hover:border-primary"}`}>{x}</button>
              ))}
            </div>
          )}
        </div>
        {list.length === 0 ? (
          <Empty title="Nothing matches" text="Try another search or clear the filter." action={<button className={btnGhost} onClick={() => { setQ(""); setF("All"); }}>Clear</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground"><tr>{cols.map((c) => <th key={c.label} className={`p-3 ${c.right ? "text-right" : ""}`}>{c.label}</th>)}</tr></thead>
              <tbody>{list.map((r, i) => <tr key={i} className="border-t border-border hover:bg-secondary/60">{cols.map((c) => <td key={c.label} className={`p-3 ${c.right ? "text-right tabular-nums" : ""}`}>{c.cell(r)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground">Showing {list.length} of {rows.length}</p>
      </Panel>
    </></Localized>
  );
}

export function CustomerLink({ id, name }: { id: string; name?: string }) {
  return <Localized><Link to="/admin/customers/$id" params={{ id }} className="font-medium hover:text-primary">{name ?? id}</Link></Localized>;
}
