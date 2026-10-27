import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Lock, Mail, Phone, Unlock } from "lucide-react";
import { toast } from "sonner";
import { accounts, cards, cases, customerById, money, transactions, type Status } from "@/lib/admin-data";
import { Empty, PageHeader, Panel, StatusBadge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/customers/$id")({
  loader: ({ params }) => {
    const c = customerById(params.id);
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.name ?? "Customer"} — Lumen Bank Admin` }, { name: "description", content: "Customer account profile and activity in Lumen Bank Admin." }, { property: "og:title", content: `${loaderData?.name ?? "Customer"} — Lumen Bank Admin` }, { property: "og:description", content: "Customer account profile and activity in Lumen Bank Admin." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  notFoundComponent: () => <Empty title="Customer not found" text="This customer may have been removed." action={<Link to="/admin/customers" className={btnGhost}>Back to customers</Link>} />,
  component: Profile,
});

const TABS = ["Overview", "Accounts", "Transactions", "Cards", "Support", "Notes"] as const;

function Profile() {
  const c = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [status, setStatus] = useState<Status>(c.status);
  const [confirm, setConfirm] = useState(false);
  const [notes, setNotes] = useState<string[]>(["Prefers contact by email. Spoke on 12 Oct about travel notice."]);
  const [draft, setDraft] = useState("");
  const accs = accounts.filter((a) => a.customer === c.id);
  const txs = transactions.filter((t) => t.customer === c.id);
  const crds = cards.filter((x) => x.customer === c.id);
  const cs = cases.filter((x) => x.customer === c.id);
  const restricted = status === "Temporarily restricted";

  const apply = () => {
    const prev = status;
    const next: Status = restricted ? "Verified" : "Temporarily restricted";
    setStatus(next); setConfirm(false);
    toast.success(restricted ? "Restriction removed" : "Account temporarily restricted", {
      description: `${c.name} is now "${next}".`,
      action: { label: "Undo", onClick: () => { setStatus(prev); toast("Change undone"); } },
    });
  };

  return (
    <>
      <PageHeader crumbs={[{ label: "Customers", to: "/admin/customers" }, { label: c.name }, { label: tab === "Overview" ? "Profile" : tab }]}
        back={{ label: "Back to customers", to: "/admin/customers" }} title={c.name} sub={`${c.segment} customer since ${c.joined} · ${c.country}`}
        actions={<>
          <StatusBadge s={status} /><StatusBadge s={`${c.risk}`} />
          <button onClick={() => setConfirm(true)} className={restricted ? btnGhost : `${btnGhost} hover:border-destructive hover:text-destructive`}>
            {restricted ? <><Unlock className="h-4 w-4" />Remove restriction</> : <><Lock className="h-4 w-4" />Restrict account</>}
          </button>
        </>} />

      {confirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="cf" className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <h2 id="cf" className="text-xl font-semibold">{restricted ? "Remove restriction?" : "Restrict this account?"}</h2>
            <dl className="mt-4 space-y-2 rounded-2xl bg-secondary p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Customer</dt><dd>{c.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Accounts affected</dt><dd>{accs.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">New status</dt><dd>{restricted ? "Verified" : "Temporarily restricted"}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">{restricted ? "The customer can use their accounts and cards again immediately." : "Outgoing payments and card use will pause. The customer is notified and can still see their balance."}</p>
            <div className="mt-6 flex gap-3">
              <button autoFocus onClick={() => setConfirm(false)} className={`${btnGhost} flex-1`}>Cancel</button>
              <button onClick={apply} className={`${btnPrimary} flex-1`}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div role="tablist" aria-label="Profile sections" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium ${tab === t ? "bg-gold text-primary-foreground" : "border border-border hover:border-primary"}`}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Identity" help="Verified against government ID at onboarding.">
            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted-foreground">Customer ID</dt><dd className="font-medium">{c.id}</dd></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{c.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{c.phone}</div>
              <div><dt className="text-muted-foreground">Verification</dt><dd><StatusBadge s={status} /></dd></div>
            </dl>
            <h3 className="mt-6 text-sm font-semibold">Documents</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {["Passport · verified", "Proof of address · verified"].map((d) => <li key={d} className="flex items-center gap-2 rounded-xl bg-secondary p-3"><FileText className="h-4 w-4 text-primary" />{d}</li>)}
            </ul>
          </Panel>
          <Panel title="Linked accounts" className="lg:col-span-2">
            <AccountsList accs={accs} />
          </Panel>
          <Panel title="Timeline" help="Everything that happened with this customer, newest first." className="lg:col-span-3">
            <ol className="relative space-y-4 border-l border-border pl-5">
              {[...txs.map((t) => ({ when: t.date, text: `${t.description} · ${money(t.amount, t.currency)}`, s: t.status })),
                ...cs.map((x) => ({ when: x.updated, text: `Support case ${x.id}: ${x.subject}`, s: x.status })),
                { when: c.joined, text: "Customer joined Lumen Bank", s: "Completed" }].map((e, i) => (
                <li key={i} className="relative flex flex-wrap items-center justify-between gap-2">
                  <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                  <div><p className="text-xs text-muted-foreground">{e.when}</p><p className="text-sm">{e.text}</p></div>
                  <StatusBadge s={e.s} />
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      )}
      {tab === "Accounts" && <Panel title="Accounts"><AccountsList accs={accs} /></Panel>}
      {tab === "Transactions" && (
        <Panel title="Transactions">
          {txs.length ? <ul className="divide-y divide-border">{txs.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div><p className="font-medium">{t.description}</p><p className="text-xs text-muted-foreground">{t.date}</p></div>
              <div className="flex items-center gap-3"><span className={`tabular-nums font-semibold ${t.amount > 0 ? "text-success" : ""}`}>{money(t.amount, t.currency)}</span><StatusBadge s={t.status} /></div>
            </li>))}</ul> : <Empty title="No recent transactions" text="Payments will appear here as soon as they happen." />}
        </Panel>
      )}
      {tab === "Cards" && (
        <Panel title="Cards">
          {crds.length ? <div className="grid gap-4 sm:grid-cols-2">{crds.map((x) => (
            <div key={x.id} className="rounded-2xl bg-secondary p-5"><div className="flex justify-between"><p className="font-medium">{x.type}</p><StatusBadge s={x.status} /></div>
              <p className="mt-3 font-display text-xl tracking-widest">•••• {x.last4}</p><p className="mt-1 text-sm text-muted-foreground">Daily limit {money(x.limit, "USD")} · Expires {x.expires}</p></div>))}</div>
            : <Empty title="No cards" text="This customer hasn't ordered a card yet." />}
        </Panel>
      )}
      {tab === "Support" && (
        <Panel title="Support history" action={<Link to="/admin/cases" className="text-sm font-semibold text-primary">Create case</Link>}>
          {cs.length ? <ul className="space-y-2">{cs.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-secondary p-4"><div><p className="font-medium">{x.subject}</p><p className="text-xs text-muted-foreground">{x.id} · {x.owner} · {x.updated}</p></div><StatusBadge s={x.status} /></li>))}</ul>
            : <Empty title="No support cases" text="This customer hasn't contacted support." />}
        </Panel>
      )}
      {tab === "Notes" && (
        <Panel title="Internal notes" help="Only visible to Lumen staff.">
          <form onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; setNotes([draft.trim(), ...notes]); setDraft(""); toast.success("Note saved"); }} className="flex gap-2">
            <label htmlFor="note" className="sr-only">New note</label>
            <input id="note" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a note for your team…" className="h-11 flex-1 rounded-full border border-border bg-secondary px-4 text-sm" />
            <button className={btnPrimary}>Save</button>
          </form>
          <ul className="mt-4 space-y-2">{notes.map((n, i) => <li key={i} className="rounded-2xl bg-secondary p-4 text-sm">{n}<p className="mt-1 text-xs text-muted-foreground">Alex Rivera</p></li>)}</ul>
        </Panel>
      )}
    </>
  );
}

function AccountsList({ accs }: { accs: typeof accounts }) {
  if (!accs.length) return <Empty title="No accounts" text="This customer has no open accounts." />;
  return (
    <ul className="space-y-3">
      {accs.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary p-4">
          <div><p className="font-medium">{a.type}</p><p className="text-xs text-muted-foreground">{a.number} · Restrictions: {a.restriction}</p></div>
          <div className="flex items-center gap-3"><span className="font-display text-lg font-semibold tabular-nums">{money(a.balance, a.currency)}</span><StatusBadge s={a.status} /></div>
        </li>
      ))}
    </ul>
  );
}
