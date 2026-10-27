import { Localized } from '@/components/localized';
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { PageHeader, Panel, Empty, btnPrimary, input } from "@/components/admin/ui";
import { listLedger, listUsers, postTransaction } from "@/lib/admin-users.functions";

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
    <PageHeader crumbs={[{ label: "Overview", to: "/admin" }, { label: "Credit & debit" }]} title="Credit & debit" sub="Add or remove money from a customer's account. Every entry needs a narration the customer will see." />
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
      <Panel title="Recent entries" className="lg:col-span-2">
        {ledger.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
          : !ledger.data?.transactions.length ? <Empty title="No entries yet" text="Credit or debit a customer on the left." />
          : <ul className="divide-y divide-border">{ledger.data.transactions.map((t) => <li key={t.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="min-w-0"><p className="truncate font-medium" data-no-translate>{t.narration}</p><p className="truncate text-xs text-muted-foreground"><span data-no-translate>{nameOf(t.userId)}</span> · {new Date(t.createdAt).toLocaleString()}</p></div>
              <div className="shrink-0 text-right"><p className={`font-semibold ${t.kind === "credit" ? "text-success" : "text-destructive"}`}>{t.kind === "credit" ? "+" : "−"}{money(t.amount)}</p><p className="text-xs text-muted-foreground">Balance {money(t.balanceAfter)}</p></div>
            </li>)}</ul>}
      </Panel>
    </div>
  </Localized>;
}
