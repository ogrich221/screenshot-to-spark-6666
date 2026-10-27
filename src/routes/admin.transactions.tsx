import { Localized } from '@/components/localized';
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { PageHeader, Panel, Empty, btnPrimary, input } from "@/components/admin/ui";
import { listLedger, listUsers, postTransaction, reviewTransaction } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({ meta: [{ title: "Credit & debit — Lumen Bank Admin" }, { name: "description", content: "Credit or debit customer accounts with a narration." }, { property: "og:title", content: "Credit & debit — Lumen Bank Admin" }, { property: "og:description", content: "Credit or debit customer accounts with a narration." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const money = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

function Page() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: useServerFn(listUsers) });
  const ledger = useQuery({ queryKey: ["admin-ledger"], queryFn: useServerFn(listLedger) });
  const post = useServerFn(postTransaction);
  const reviewFn = useServerFn(reviewTransaction);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const review = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => reviewFn({ data: { ...v, note: notes[v.id] ?? "" } }),
    onSuccess: (r) => { if (!r.ok) toast.error(r.error); else toast.success(r.status === "completed" ? "Approved. The balance was debited." : "Declined. The balance was not changed."); qc.invalidateQueries({ queryKey: ["admin-ledger"] }); },
    onError: () => toast.error("Could not review the transaction."),
  });
  const pending = ledger.data?.transactions.filter((t) => t.status === "pending") ?? [];
  const history = ledger.data?.transactions.filter((t) => t.status !== "pending") ?? [];
  const cat: Record<string, string> = { bill: "Utility bill", domestic: "Domestic transfer", international: "International wire", adjustment: "Admin entry" };
  const [form, setForm] = useState({ userId: "", kind: "credit" as "credit" | "debit", amount: "", narration: "" });
  const balances = ledger.data?.balances ?? {};
  const customers = (users.data ?? []).filter((u) => !u.isAdmin && u.id in balances);
  const nameOf = (id: string) => { const u = users.data?.find((x) => x.id === id); return u?.name || u?.email || "Unknown user"; };
  const valid = /^\d+(\.\d{1,2})?$/.test(form.amount) && Number(form.amount) > 0;

  const add = useMutation({
    mutationFn: () => post({ data: form }),
    onSuccess: (r) => {
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(`${form.kind === "credit" ? "Credited" : "Debited"} ${money(Number(form.amount))}. New balance ${money(r.balance)}.`);
      setForm({ ...form, amount: "", narration: "" });
      qc.invalidateQueries({ queryKey: ["admin-ledger"] });
    },
    onError: () => toast.error("Check the amount and narration."),
  });

  return <Localized>
    <PageHeader crumbs={[{ label: "Overview", to: "/admin" }, { label: "Credit & debit" }]} title="Transactions" sub="Approve or decline customer payments, and add or remove money from a customer's account. Every entry needs a narration the customer will see." />
    <Panel title={`Awaiting approval (${pending.length})`} className="mb-6">
      {!pending.length ? <p className="text-sm text-muted-foreground">No transactions are waiting for approval.</p>
        : <ul className="divide-y divide-border">{pending.map((t) => <li key={t.id} className="space-y-3 py-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="font-medium" data-no-translate>{t.narration}</p><p className="text-xs text-muted-foreground">{cat[t.category] ?? t.category} · <span data-no-translate>{nameOf(t.userId)}</span> · {new Date(t.createdAt).toLocaleString()} · balance {money(balances[t.userId] ?? 0)}</p></div>
              <p className="font-semibold text-destructive">−{money(t.amount)}</p>
            </div>
            <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">{Object.entries(t.details).map(([k, v]) => <div key={k} className="flex gap-2"><dt className="text-muted-foreground">{k}</dt><dd className="break-all" data-no-translate>{v}</dd></div>)}</dl>
            <div className="flex flex-wrap gap-2">
              <input placeholder="Note to customer (optional)" maxLength={200} className={`${input} min-w-0 flex-1`} value={notes[t.id] ?? ""} onChange={(e) => setNotes({ ...notes, [t.id]: e.target.value })} />
              <button disabled={review.isPending} onClick={() => review.mutate({ id: t.id, approve: true })} className={btnPrimary}>Approve</button>
              <button disabled={review.isPending} onClick={() => review.mutate({ id: t.id, approve: false })} className="rounded-xl border border-destructive px-4 py-2 text-sm font-semibold text-destructive">Decline</button>
            </div>
          </li>)}</ul>}
    </Panel>
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="New entry" className="lg:col-span-1">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <label className="block text-sm">Customer
            <select required className={`${input} mt-1 w-full`} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">Choose a customer</option>
              {customers.map((u) => <option key={u.id} value={u.id}>{(u.name || u.email) + " — " + money(balances[u.id] ?? 0)}</option>)}
            </select></label>
          {!customers.length && <p className="text-xs text-muted-foreground">Only customers who have opened an account can be credited or debited.</p>}
          <div className="grid grid-cols-2 gap-2">
            {(["credit", "debit"] as const).map((k) => <button type="button" key={k} onClick={() => setForm({ ...form, kind: k })} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${form.kind === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{k === "credit" ? <><ArrowDownLeft className="h-4 w-4" />Credit</> : <><ArrowUpRight className="h-4 w-4" />Debit</>}</button>)}
          </div>
          <label className="block text-sm">Amount (USD)<input required inputMode="decimal" placeholder="0.00" className={`${input} mt-1 w-full`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label className="block text-sm">Narration<textarea required maxLength={200} rows={3} placeholder="e.g. Salary for October" className={`${input} mt-1 w-full`} value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} /></label>
          {form.userId && valid && <p className="text-xs text-muted-foreground">New balance: {money((balances[form.userId] ?? 0) + (form.kind === "credit" ? 1 : -1) * Number(form.amount))}</p>}
          <button disabled={add.isPending || !form.userId || !valid || !form.narration.trim()} className={`${btnPrimary} w-full`}>{add.isPending ? "Posting…" : form.kind === "credit" ? "Credit account" : "Debit account"}</button>
        </form>
      </Panel>
      <Panel title="History" className="lg:col-span-2">
        {ledger.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
          : !history.length ? <Empty title="No entries yet" text="Credit or debit a customer on the left." />
          : <ul className="divide-y divide-border">{history.map((t) => <li key={t.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="min-w-0"><p className="truncate font-medium" data-no-translate>{t.narration}</p><p className="truncate text-xs text-muted-foreground"><span data-no-translate>{nameOf(t.userId)}</span> · {cat[t.category] ?? t.category} · {t.status === "declined" ? "Declined" : "Completed"} · {new Date(t.createdAt).toLocaleString()}</p></div>
              <div className="shrink-0 text-right"><p className={`font-semibold ${t.kind === "credit" ? "text-success" : "text-destructive"}`}>{t.kind === "credit" ? "+" : "−"}{money(t.amount)}</p>{t.balanceAfter != null && <p className="text-xs text-muted-foreground">Balance {money(t.balanceAfter)}</p>}</div>
            </li>)}</ul>}
      </Panel>
    </div>
  </Localized>;
}
