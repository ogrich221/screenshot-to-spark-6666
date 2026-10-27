import { Localized } from '@/components/localized';
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Info } from "lucide-react";
import type { ReactNode } from "react";

const tone: Record<string, string> = {
  Verified: "bg-success/15 text-success", Completed: "bg-success/15 text-success", Active: "bg-success/15 text-success", Resolved: "bg-success/15 text-success", Low: "bg-success/15 text-success",
  "Review needed": "bg-warning/15 text-warning", Pending: "bg-warning/15 text-warning", "Needs attention": "bg-warning/15 text-warning", Open: "bg-warning/15 text-warning", Medium: "bg-warning/15 text-warning", Frozen: "bg-info/15 text-info",
  "Temporarily restricted": "bg-destructive/15 text-destructive", Flagged: "bg-destructive/15 text-destructive", Urgent: "bg-destructive/15 text-destructive", High: "bg-destructive/15 text-destructive",
  Informational: "bg-info/15 text-info", "Waiting on customer": "bg-info/15 text-info",
  Closed: "bg-muted text-muted-foreground", Reversed: "bg-muted text-muted-foreground", Cancelled: "bg-muted text-muted-foreground",
};

export function StatusBadge({ s }: { s: string }) {
  return <Localized><span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone[s] ?? "bg-muted text-muted-foreground"}`}><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />{s}</span></Localized>;
}

export type Crumb = { label: string; to?: string };

export function PageHeader({ crumbs, title, sub, back, actions }: { crumbs: Crumb[]; title: string; sub?: string; back?: { label: string; to: string; search?: Record<string, unknown> }; actions?: ReactNode }) {
  return (
    <Localized><div className="mb-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            {c.to ? <Link to={c.to} className="hover:text-primary">{c.label}</Link> : <span aria-current="page" className="text-foreground">{c.label}</span>}
          </span>
        ))}
      </nav>
      {back && (
        <Link to={back.to} search={back.search as never} className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> {back.label}
        </Link>
      )}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
          {sub && <p className="mt-2 max-w-2xl text-muted-foreground">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div></Localized>
  );
}

export function Panel({ title, help, children, action, className = "" }: { title?: string; help?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <Localized><section className={`glass rounded-3xl p-5 md:p-6 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            {title}
            {help && <span title={help} aria-label={help} className="text-muted-foreground"><Info className="h-4 w-4" /></span>}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section></Localized>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Localized><div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div></Localized>
  );
}

export const btn = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition";
export const btnPrimary = `${btn} bg-gold text-primary-foreground shadow-glow hover:-translate-y-0.5`;
export const btnGhost = `${btn} border border-border hover:border-primary hover:text-primary`;
export const input = "h-11 rounded-full border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
