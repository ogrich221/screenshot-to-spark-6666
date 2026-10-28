import { Localized } from '@/components/localized';
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Calendar, Edit3, X } from "lucide-react";
import { PageHeader, Panel, Empty, btnPrimary, btnGhost, input, StatusBadge } from "@/components/admin/ui";
import { listLedger, listUsers, postTransaction, reviewTransaction, updateTransaction, type Txn } from "@/lib/admin-users.functions";
import { loadAdminData } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({
    meta: [
      { title: "Credit & debit — Lumen Bank Admin" },
      { name: "description", content: "Credit or debit customer accounts with a custom narration and date." },
      { property: "og:title", content: "Credit & debit — Lumen Bank Admin" },
      { property: "og:description", content: "Credit or debit customer accounts with a custom narration and date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const money = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

function toLocalDatetimeInput(d?: string | Date) {
  const date = d ? new Date(d) : new Date();
  if (isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function Page() {
  loadAdminData();
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: useServerFn(listUsers) });
  const ledger = useQuery({ queryKey: ["admin-ledger"], queryFn: useServerFn(listLedger) });
  const post = useServerFn(postTransaction);
  const reviewFn = useServerFn(reviewTransaction);
  const updateFn = useServerFn(updateTransaction);

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterKind, setFilterKind] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit transaction modal state
  const [editingTx, setEditingTx] = useState<Txn | null>(null);
  const [editForm, setEditForm] = useState({
    narration: "",
    date: "",
    kind: "credit" as "credit" | "debit",
    status: "completed" as "completed" | "pending" | "declined",
  });

  const openEditModal = (t: Txn) => {
    setEditingTx(t);
    setEditForm({
      narration: t.narration,
      date: toLocalDatetimeInput(t.createdAt),
      kind: t.kind as "credit" | "debit",
      status: t.status as "completed" | "pending" | "declined",
    });
  };

  const editMutation = useMutation({
    mutationFn: () => {
      if (!editingTx) throw new Error("No transaction selected");
      return updateFn({
        data: {
          id: editingTx.id,
          narration: editForm.narration,
          date: editForm.date ? new Date(editForm.date).toISOString() : undefined,
          kind: editForm.kind,
          status: editForm.status,
        },
      });
    },
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error("Could not update transaction.");
        return;
      }
      toast.success("Transaction updated successfully.");
      setEditingTx(null);
      qc.invalidateQueries({ queryKey: ["admin-ledger"] });
      qc.invalidateQueries({ queryKey: ["my-transactions"] });
    },
    onError: () => toast.error("Could not save changes to transaction."),
  });

  const review = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => reviewFn({ data: { ...v, note: notes[v.id] ?? "" } }),
    onSuccess: (r) => {
      if (!r.ok) toast.error(r.error);
      else toast.success(r.status === "completed" ? "Approved. The balance was debited." : "Declined. The balance was not changed.");
      qc.invalidateQueries({ queryKey: ["admin-ledger"] });
    },
    onError: () => toast.error("Could not review the transaction."),
  });

  const pending = ledger.data?.transactions.filter((t) => t.status === "pending") ?? [];
  const history = ledger.data?.transactions.filter((t) => t.status !== "pending") ?? [];
  const cat: Record<string, string> = { bill: "Utility bill", domestic: "Domestic transfer", international: "International wire", adjustment: "Admin entry" };

  const [form, setForm] = useState({
    userId: "",
    kind: "credit" as "credit" | "debit",
    amount: "",
    narration: "",
    date: "",
  });

  const balances = ledger.data?.balances ?? {};
  const customers = (users.data ?? []).filter((u) => !u.isAdmin);
  const nameOf = (id: string) => {
    const u = users.data?.find((x) => x.id === id);
    return u?.name || u?.email || id;
  };
  const getBal = (id: string) => balances[id] ?? users.data?.find((x) => x.id === id)?.balance ?? 0;
  const valid = /^\d+(\.\d{1,2})?$/.test(form.amount) && Number(form.amount) > 0;

  const add = useMutation({
    mutationFn: () => post({
      data: {
        userId: form.userId,
        kind: form.kind,
        amount: form.amount,
        narration: form.narration,
        date: form.date ? new Date(form.date).toISOString() : undefined,
      },
    }),
    onSuccess: (r) => {
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(`${form.kind === "credit" ? "Credited" : "Debited"} ${money(Number(form.amount))}. New balance: ${money(r.balance)}.`);
      setForm({ ...form, amount: "", narration: "", date: "" });
      qc.invalidateQueries({ queryKey: ["admin-ledger"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["my-transactions"] });
    },
    onError: () => toast.error("Check the amount, narration, and date."),
  });

  const filteredHistory = history.filter((t) => {
    if (filterUser !== "all" && t.userId !== filterUser) return false;
    if (filterKind !== "all" && t.kind !== filterKind) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const n = (nameOf(t.userId) || "").toLowerCase();
      const desc = (t.narration || "").toLowerCase();
      if (!n.includes(q) && !desc.includes(q)) return false;
    }
    return true;
  });

  return (
    <Localized>
      <PageHeader
        crumbs={[{ label: "Overview", to: "/admin" }, { label: "Credit & debit" }]}
        title="Transactions"
        sub="Credit and debit user balances, specify narration, adjust transaction dates, and review payments."
      />

      <Panel title={`Awaiting approval (${pending.length})`} className="mb-6">
        {!pending.length ? (
          <p className="text-sm text-muted-foreground">No transactions are waiting for approval.</p>
        ) : (
          <ul className="divide-y divide-border">
            {pending.map((t) => (
              <li key={t.id} className="space-y-3 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium" data-no-translate>{t.narration}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat[t.category] ?? t.category} · <span data-no-translate>{nameOf(t.userId)}</span> · {new Date(t.createdAt).toLocaleString()} · balance {money(getBal(t.userId))}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-destructive">−{money(t.amount)}</p>
                    <button
                      onClick={() => openEditModal(t)}
                      className={`${btnGhost} h-8 px-2.5 text-xs`}
                      title="Edit narration or date"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                </div>
                <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                  {Object.entries(t.details).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="break-all" data-no-translate>{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-2">
                  <input
                    placeholder="Note to customer (optional)"
                    maxLength={200}
                    className={`${input} min-w-0 flex-1`}
                    value={notes[t.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [t.id]: e.target.value })}
                  />
                  <button disabled={review.isPending} onClick={() => review.mutate({ id: t.id, approve: true })} className={btnPrimary}>
                    Approve
                  </button>
                  <button
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: t.id, approve: false })}
                    className="rounded-xl border border-destructive px-4 py-2 text-sm font-semibold text-destructive"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* New entry form */}
        <Panel title="Post transaction" className="lg:col-span-1">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
            <label className="block text-sm">
              Select User / Customer
              <select
                required
                className={`${input} mt-1 w-full`}
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
              >
                <option value="">Choose a user</option>
                {customers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {(u.name || u.email) + " — " + money(getBal(u.id))}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {(["credit", "debit"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setForm({ ...form, kind: k })}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                    form.kind === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {k === "credit" ? <><ArrowDownLeft className="h-4 w-4" />Credit (+)</> : <><ArrowUpRight className="h-4 w-4" />Debit (−)</>}
                </button>
              ))}
            </div>

            <label className="block text-sm">
              Amount (USD)
              <input
                required
                inputMode="decimal"
                placeholder="0.00"
                className={`${input} mt-1 w-full`}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </label>

            <label className="block text-sm">
              Narration / Description
              <textarea
                required
                maxLength={200}
                rows={2}
                placeholder="e.g. Salary deposit, Wire transfer, Account bonus"
                className={`${input} mt-1 h-auto py-2 w-full`}
                value={form.narration}
                onChange={(e) => setForm({ ...form, narration: e.target.value })}
              />
            </label>

            <label className="block text-sm">
              Transaction Date & Time
              <div className="mt-1 flex gap-2">
                <input
                  type="datetime-local"
                  className={`${input} min-w-0 flex-1`}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, date: toLocalDatetimeInput() })}
                  className={`${btnGhost} px-3 text-xs`}
                >
                  Now
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Pick a custom date/time or leave empty for current time.</p>
            </label>

            {form.userId && valid && (
              <div className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Current balance:</span>
                  <span className="font-medium text-foreground">{money(getBal(form.userId))}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Projected new balance:</span>
                  <span className="font-semibold text-primary">
                    {money(getBal(form.userId) + (form.kind === "credit" ? 1 : -1) * Number(form.amount))}
                  </span>
                </div>
              </div>
            )}

            <button
              disabled={add.isPending || !form.userId || !valid || !form.narration.trim()}
              className={`${btnPrimary} w-full`}
            >
              {add.isPending ? "Posting…" : form.kind === "credit" ? "Credit user account" : "Debit user account"}
            </button>
          </form>
        </Panel>

        {/* History */}
        <Panel title="Transaction History" className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              placeholder="Search narration or customer…"
              className={`${input} h-9 min-w-[180px] flex-1 text-xs`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              aria-label="Filter user"
              className={`${input} h-9 text-xs`}
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
            >
              <option value="all">All customers</option>
              {customers.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
            <select
              aria-label="Filter type"
              className={`${input} h-9 text-xs`}
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
            >
              <option value="all">All types</option>
              <option value="credit">Credits (+)</option>
              <option value="debit">Debits (−)</option>
            </select>
          </div>

          {ledger.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading transactions…</p>
          ) : !filteredHistory.length ? (
            <Empty title="No matching entries" text="Post a credit/debit or clear filters." />
          ) : (
            <ul className="divide-y divide-border">
              {filteredHistory.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground" data-no-translate>{t.narration}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span data-no-translate className="font-medium text-foreground/80">{nameOf(t.userId)}</span> · {cat[t.category] ?? t.category} · {t.status === "declined" ? "Declined" : "Completed"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(t.createdAt).toLocaleString(undefined, {
                        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-semibold tabular-nums ${t.kind === "credit" ? "text-success" : "text-destructive"}`}>
                        {t.kind === "credit" ? "+" : "−"}{money(t.amount)}
                      </p>
                      {t.balanceAfter != null && (
                        <p className="text-xs text-muted-foreground">Bal {money(t.balanceAfter)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => openEditModal(t)}
                      className={`${btnGhost} h-9 px-3 text-xs`}
                      title="Edit narration and date"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Edit Transaction</h2>
                <p className="text-xs text-muted-foreground">Update narration, transaction date, or status.</p>
              </div>
              <button onClick={() => setEditingTx(null)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="mt-4 space-y-4 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                editMutation.mutate();
              }}
            >
              <div>
                <span className="text-xs text-muted-foreground">Customer</span>
                <p className="font-medium">{nameOf(editingTx.userId)}</p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Amount</span>
                <p className={`font-semibold ${editingTx.kind === "credit" ? "text-success" : "text-destructive"}`}>
                  {editingTx.kind === "credit" ? "+" : "−"}{money(editingTx.amount)}
                </p>
              </div>

              <label className="block text-sm">
                Narration / Description
                <textarea
                  required
                  maxLength={200}
                  rows={2}
                  className={`${input} mt-1 h-auto py-2 w-full`}
                  value={editForm.narration}
                  onChange={(e) => setEditForm({ ...editForm, narration: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                Transaction Date & Time
                <div className="mt-1 flex gap-2">
                  <input
                    type="datetime-local"
                    required
                    className={`${input} min-w-0 flex-1`}
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, date: toLocalDatetimeInput() })}
                    className={`${btnGhost} px-3 text-xs`}
                  >
                    Now
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  Type
                  <select
                    className={`${input} mt-1 w-full`}
                    value={editForm.kind}
                    onChange={(e) => setEditForm({ ...editForm, kind: e.target.value as "credit" | "debit" })}
                  >
                    <option value="credit">Credit (+)</option>
                    <option value="debit">Debit (−)</option>
                  </select>
                </label>

                <label className="block text-sm">
                  Status
                  <select
                    className={`${input} mt-1 w-full`}
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "completed" | "pending" | "declined" })}
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" className={btnGhost} onClick={() => setEditingTx(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending || !editForm.narration.trim()}
                  className={btnPrimary}
                >
                  {editMutation.isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Localized>
  );
}
