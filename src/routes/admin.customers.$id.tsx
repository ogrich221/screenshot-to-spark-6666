import { Localized } from '@/components/localized';
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Edit2,
  Edit3,
  FileText,
  Lock,
  Mail,
  Phone,
  Plus,
  Unlock,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  accounts,
  cards,
  cases,
  customerById,
  money,
  transactions,
  updateCustomerProfile,
  postAccountTransaction,
  updateAdminTransaction,
  type Status,
  type AdminTx,
  type Customer,
  type TxStatus,
} from "@/lib/admin-data";
import { Empty, PageHeader, Panel, StatusBadge, btnGhost, btnPrimary, input } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/customers/$id")({
  loader: ({ params }) => {
    const c = customerById(params.id);
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Customer"} — Lumen Bank Admin` },
      { name: "description", content: "Customer account profile and activity in Lumen Bank Admin." },
      { property: "og:title", content: `${loaderData?.name ?? "Customer"} — Lumen Bank Admin` },
      { property: "og:description", content: "Customer account profile and activity in Lumen Bank Admin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <Empty
      title="Customer not found"
      text="This customer may have been removed."
      action={<Link to="/admin/customers" className={btnGhost}>Back to customers</Link>}
    />
  ),
  component: Profile,
});

const TABS = ["Overview", "Accounts", "Transactions", "Cards", "Support", "Notes"] as const;

function toLocalDatetimeInput(d?: string | Date) {
  const date = d ? new Date(d) : new Date();
  if (isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function Profile() {
  const initial = Route.useLoaderData();
  const [c, setCustomer] = useState<Customer>(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [status, setStatus] = useState<Status>(c.status);
  const [confirm, setConfirm] = useState(false);
  const [notes, setNotes] = useState<string[]>(["Prefers contact by email. Spoke on 12 Oct about travel notice."]);
  const [draft, setDraft] = useState("");

  // Force re-renders when data updates
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const accs = accounts.filter((a) => a.customer === c.id);
  const txs = transactions.filter((t) => t.customer === c.id);
  const crds = cards.filter((x) => x.customer === c.id);
  const cs = cases.filter((x) => x.customer === c.id);
  const restricted = status === "Temporarily restricted";

  // Modals state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: c.name,
    email: c.email,
    phone: c.phone,
    country: c.country,
    segment: c.segment,
    risk: c.risk,
    status: c.status,
    address: c.address || "",
    city: c.city || "",
    region: c.region || "",
    postal: c.postal || "",
  });

  const [creditDebitOpen, setCreditDebitOpen] = useState(false);
  const [cdForm, setCdForm] = useState({
    accountId: accs[0]?.id || "",
    kind: "credit" as "credit" | "debit",
    amount: "",
    narration: "Direct deposit / adjustment",
    date: toLocalDatetimeInput(),
  });

  const [editingTx, setEditingTx] = useState<AdminTx | null>(null);
  const [editTxForm, setEditTxForm] = useState({
    description: "",
    date: "",
    status: "Completed" as TxStatus,
  });

  const applyRestriction = () => {
    const prev = status;
    const next: Status = restricted ? "Verified" : "Temporarily restricted";
    setStatus(next);
    setConfirm(false);
    updateCustomerProfile(c.id, { status: next });
    setCustomer({ ...c, status: next });
    toast.success(restricted ? "Restriction removed" : "Account temporarily restricted", {
      description: `${c.name} is now "${next}".`,
      action: {
        label: "Undo",
        onClick: () => {
          setStatus(prev);
          updateCustomerProfile(c.id, { status: prev });
          setCustomer({ ...c, status: prev });
          toast("Change undone");
        },
      },
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateCustomerProfile(c.id, profileForm);
    if (updated) {
      setCustomer({ ...updated });
      setStatus(updated.status);
    }
    setEditProfileOpen(false);
    toast.success("Customer profile updated successfully.");
    refresh();
  };

  const handlePostTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(cdForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    const res = postAccountTransaction({
      customerId: c.id,
      accountId: cdForm.accountId,
      kind: cdForm.kind,
      amount,
      narration: cdForm.narration,
      date: cdForm.date,
    });
    setCreditDebitOpen(false);
    toast.success(`${cdForm.kind === "credit" ? "Credited" : "Debited"} ${money(amount)}. New balance: ${money(res.newBalance)}.`);
    refresh();
  };

  const openEditTx = (t: AdminTx) => {
    setEditingTx(t);
    setEditTxForm({
      description: t.description,
      date: toLocalDatetimeInput(t.date),
      status: t.status,
    });
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    const formattedDate = editTxForm.date ? editTxForm.date.replace("T", " ") : editingTx.date;
    updateAdminTransaction(editingTx.id, {
      description: editTxForm.description.trim(),
      date: formattedDate,
      status: editTxForm.status,
    });
    setEditingTx(null);
    toast.success("Transaction updated.");
    refresh();
  };

  return (
    <Localized>
      <PageHeader
        crumbs={[{ label: "Customers", to: "/admin/customers" }, { label: c.name }, { label: tab === "Overview" ? "Profile" : tab }]}
        back={{ label: "Back to customers", to: "/admin/customers" }}
        title={c.name}
        sub={`${c.segment} customer since ${c.joined} · ${c.country}`}
        actions={
          <>
            <StatusBadge s={status} />
            <StatusBadge s={`${c.risk}`} />

            {/* Direct Credit / Debit button */}
            <button
              onClick={() => {
                setCdForm({
                  accountId: accs[0]?.id || "",
                  kind: "credit",
                  amount: "",
                  narration: "Account credit",
                  date: toLocalDatetimeInput(),
                });
                setCreditDebitOpen(true);
              }}
              className={`${btnPrimary} h-9 px-4 text-xs font-semibold`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" /> Credit / Debit
            </button>

            {/* Edit Profile button */}
            <button
              onClick={() => {
                setProfileForm({
                  name: c.name,
                  email: c.email,
                  phone: c.phone,
                  country: c.country,
                  segment: c.segment,
                  risk: c.risk,
                  status: c.status,
                  address: c.address || "",
                  city: c.city || "",
                  region: c.region || "",
                  postal: c.postal || "",
                });
                setEditProfileOpen(true);
              }}
              className={`${btnGhost} h-9 px-4 text-xs font-semibold`}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Profile
            </button>

            <button
              onClick={() => setConfirm(true)}
              className={restricted ? btnGhost : `${btnGhost} h-9 px-4 text-xs hover:border-destructive hover:text-destructive`}
            >
              {restricted ? <><Unlock className="h-3.5 w-3.5" /> Remove restriction</> : <><Lock className="h-3.5 w-3.5" /> Restrict account</>}
            </button>
          </>
        }
      />

      {confirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="cf" className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <h2 id="cf" className="text-xl font-semibold">{restricted ? "Remove restriction?" : "Restrict this account?"}</h2>
            <dl className="mt-4 space-y-2 rounded-2xl bg-secondary p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Customer</dt><dd>{c.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Accounts affected</dt><dd>{accs.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">New status</dt><dd>{restricted ? "Verified" : "Temporarily restricted"}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">
              {restricted
                ? "The customer can use their accounts and cards again immediately."
                : "Outgoing payments and card use will pause. The customer is notified and can still see their balance."}
            </p>
            <div className="mt-6 flex gap-3">
              <button autoFocus onClick={() => setConfirm(false)} className={`${btnGhost} flex-1`}>Cancel</button>
              <button onClick={applyRestriction} className={`${btnPrimary} flex-1`}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div role="tablist" aria-label="Profile sections" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium ${
              tab === t ? "bg-gold text-primary-foreground" : "border border-border hover:border-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            title="Identity"
            help="Verified against government ID at onboarding."
            action={
              <button onClick={() => setEditProfileOpen(true)} className="text-xs font-semibold text-primary hover:underline">
                Edit
              </button>
            }
          >
            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted-foreground">Customer ID</dt><dd className="font-medium">{c.id}</dd></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{c.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{c.phone}</div>
              <div><dt className="text-muted-foreground">Verification</dt><dd><StatusBadge s={status} /></dd></div>
              {c.address && <div><dt className="text-muted-foreground">Address</dt><dd>{c.address}, {c.city} {c.postal}</dd></div>}
            </dl>
            <h3 className="mt-6 text-sm font-semibold">Documents</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {["Passport · verified", "Proof of address · verified"].map((d) => (
                <li key={d} className="flex items-center gap-2 rounded-xl bg-secondary p-3">
                  <FileText className="h-4 w-4 text-primary" />{d}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Linked accounts"
            className="lg:col-span-2"
            action={
              <button
                onClick={() => setCreditDebitOpen(true)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Post credit / debit
              </button>
            }
          >
            <AccountsList
              accs={accs}
              onCreditDebit={(accId, kind) => {
                setCdForm({
                  accountId: accId,
                  kind,
                  amount: "",
                  narration: kind === "credit" ? "Account credit" : "Account debit",
                  date: toLocalDatetimeInput(),
                });
                setCreditDebitOpen(true);
              }}
            />
          </Panel>

          <Panel title="Timeline" help="Everything that happened with this customer, newest first." className="lg:col-span-3">
            <ol className="relative space-y-4 border-l border-border pl-5">
              {[
                ...txs.map((t) => ({ when: t.date, text: `${t.description} · ${money(t.amount, t.currency)}`, s: t.status })),
                ...cs.map((x) => ({ when: x.updated, text: `Support case ${x.id}: ${x.subject}`, s: x.status })),
                { when: c.joined, text: "Customer joined Lumen Bank", s: "Completed" },
              ].map((e, i) => (
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

      {tab === "Accounts" && (
        <Panel
          title="Accounts"
          action={
            <button
              onClick={() => setCreditDebitOpen(true)}
              className={`${btnPrimary} h-8 px-3 text-xs`}
            >
              <Plus className="h-3.5 w-3.5" /> Post Transaction
            </button>
          }
        >
          <AccountsList
            accs={accs}
            onCreditDebit={(accId, kind) => {
              setCdForm({
                accountId: accId,
                kind,
                amount: "",
                narration: kind === "credit" ? "Account credit" : "Account debit",
                date: toLocalDatetimeInput(),
              });
              setCreditDebitOpen(true);
            }}
          />
        </Panel>
      )}

      {tab === "Transactions" && (
        <Panel
          title="Transactions"
          action={
            <button
              onClick={() => {
                setCdForm({
                  accountId: accs[0]?.id || "",
                  kind: "credit",
                  amount: "",
                  narration: "Direct transaction",
                  date: toLocalDatetimeInput(),
                });
                setCreditDebitOpen(true);
              }}
              className={`${btnPrimary} h-8 px-3 text-xs`}
            >
              <Plus className="h-3.5 w-3.5" /> New Transaction
            </button>
          }
        >
          {txs.length ? (
            <ul className="divide-y divide-border">
              {txs.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{t.description}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {t.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`tabular-nums font-semibold ${t.amount > 0 ? "text-success" : "text-destructive"}`}>
                      {t.amount > 0 ? "+" : ""}{money(t.amount, t.currency)}
                    </span>
                    <StatusBadge s={t.status} />
                    <button
                      onClick={() => openEditTx(t)}
                      className={`${btnGhost} h-8 px-2.5 text-xs`}
                      title="Edit narration or date"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No recent transactions" text="Post a credit or debit to add the first entry." />
          )}
        </Panel>
      )}

      {tab === "Cards" && (
        <Panel title="Cards">
          {crds.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {crds.map((x) => (
                <div key={x.id} className="rounded-2xl bg-secondary p-5">
                  <div className="flex justify-between"><p className="font-medium">{x.type}</p><StatusBadge s={x.status} /></div>
                  <p className="mt-3 font-display text-xl tracking-widest">•••• {x.last4}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Daily limit {money(x.limit, "USD")} · Expires {x.expires}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No cards" text="This customer hasn't ordered a card yet." />
          )}
        </Panel>
      )}

      {tab === "Support" && (
        <Panel title="Support history" action={<Link to="/admin/cases" className="text-sm font-semibold text-primary">Create case</Link>}>
          {cs.length ? (
            <ul className="space-y-2">
              {cs.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-secondary p-4">
                  <div><p className="font-medium">{x.subject}</p><p className="text-xs text-muted-foreground">{x.id} · {x.owner} · {x.updated}</p></div>
                  <StatusBadge s={x.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No support cases" text="This customer hasn't contacted support." />
          )}
        </Panel>
      )}

      {tab === "Notes" && (
        <Panel title="Internal notes" help="Only visible to Lumen staff.">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setNotes([draft.trim(), ...notes]);
              setDraft("");
              toast.success("Note saved");
            }}
            className="flex gap-2"
          >
            <label htmlFor="note" className="sr-only">New note</label>
            <input
              id="note"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note for your team…"
              className="h-11 flex-1 rounded-full border border-border bg-secondary px-4 text-sm"
            />
            <button className={btnPrimary}>Save</button>
          </form>
          <ul className="mt-4 space-y-2">
            {notes.map((n, i) => (
              <li key={i} className="rounded-2xl bg-secondary p-4 text-sm">
                {n}<p className="mt-1 text-xs text-muted-foreground" data-no-translate>LUMENBANK CEO</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Edit Profile Dialog */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-lg font-semibold">Edit Customer Profile</h2>
              <button onClick={() => setEditProfileOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3 text-sm">
              <label className="block">
                Full Name
                <input
                  required
                  className={`${input} mt-1 w-full`}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  Email
                  <input
                    required
                    type="email"
                    className={`${input} mt-1 w-full`}
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </label>
                <label className="block">
                  Phone
                  <input
                    required
                    className={`${input} mt-1 w-full`}
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  Country
                  <input
                    className={`${input} mt-1 w-full`}
                    value={profileForm.country}
                    onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  />
                </label>
                <label className="block">
                  Segment
                  <select
                    className={`${input} mt-1 w-full`}
                    value={profileForm.segment}
                    onChange={(e) => setProfileForm({ ...profileForm, segment: e.target.value as "Personal" | "Business" | "Premier" })}
                  >
                    <option value="Personal">Personal</option>
                    <option value="Premier">Premier</option>
                    <option value="Business">Business</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  Status
                  <select
                    className={`${input} mt-1 w-full`}
                    value={profileForm.status}
                    onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value as Status })}
                  >
                    <option value="Verified">Verified</option>
                    <option value="Review needed">Review needed</option>
                    <option value="Temporarily restricted">Temporarily restricted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </label>
                <label className="block">
                  Risk
                  <select
                    className={`${input} mt-1 w-full`}
                    value={profileForm.risk}
                    onChange={(e) => setProfileForm({ ...profileForm, risk: e.target.value as "Low" | "Medium" | "High" })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
              </div>
              <label className="block">
                Address
                <input
                  className={`${input} mt-1 w-full`}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </label>
              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-3">
                <button type="button" className={btnGhost} onClick={() => setEditProfileOpen(false)}>Cancel</button>
                <button type="submit" className={btnPrimary}>Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit / Debit Dialog */}
      {creditDebitOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-lg font-semibold">Credit or Debit Account</h2>
              <button onClick={() => setCreditDebitOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePostTransaction} className="mt-4 space-y-3 text-sm">
              {accs.length > 1 && (
                <label className="block">
                  Account
                  <select
                    className={`${input} mt-1 w-full`}
                    value={cdForm.accountId}
                    onChange={(e) => setCdForm({ ...cdForm, accountId: e.target.value })}
                  >
                    {accs.map((a) => (
                      <option key={a.id} value={a.id}>{a.type} ({a.number}) — {money(a.balance, a.currency)}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="grid grid-cols-2 gap-2">
                {(["credit", "debit"] as const).map((k) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setCdForm({ ...cdForm, kind: k })}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                      cdForm.kind === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {k === "credit" ? <><ArrowDownLeft className="h-4 w-4" />Credit (+)</> : <><ArrowUpRight className="h-4 w-4" />Debit (−)</>}
                  </button>
                ))}
              </div>
              <label className="block">
                Amount (USD)
                <input
                  required
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`${input} mt-1 w-full`}
                  value={cdForm.amount}
                  onChange={(e) => setCdForm({ ...cdForm, amount: e.target.value })}
                />
              </label>
              <label className="block">
                Narration / Description
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Salary deposit, Wire adjustment"
                  className={`${input} mt-1 h-auto py-2 w-full`}
                  value={cdForm.narration}
                  onChange={(e) => setCdForm({ ...cdForm, narration: e.target.value })}
                />
              </label>
              <label className="block">
                Transaction Date & Time
                <div className="mt-1 flex gap-2">
                  <input
                    type="datetime-local"
                    className={`${input} min-w-0 flex-1`}
                    value={cdForm.date}
                    onChange={(e) => setCdForm({ ...cdForm, date: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setCdForm({ ...cdForm, date: toLocalDatetimeInput() })}
                    className={`${btnGhost} px-3 text-xs`}
                  >
                    Now
                  </button>
                </div>
              </label>
              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-3">
                <button type="button" className={btnGhost} onClick={() => setCreditDebitOpen(false)}>Cancel</button>
                <button type="submit" className={btnPrimary}>
                  {cdForm.kind === "credit" ? "Credit Account" : "Debit Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Dialog */}
      {editingTx && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-lg font-semibold">Edit Transaction</h2>
              <button onClick={() => setEditingTx(null)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTx} className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Amount</span>
                <p className={`font-semibold ${editingTx.amount > 0 ? "text-success" : "text-destructive"}`}>
                  {editingTx.amount > 0 ? "+" : ""}{money(editingTx.amount, editingTx.currency)}
                </p>
              </div>
              <label className="block">
                Narration / Description
                <textarea
                  required
                  rows={2}
                  className={`${input} mt-1 h-auto py-2 w-full`}
                  value={editTxForm.description}
                  onChange={(e) => setEditTxForm({ ...editTxForm, description: e.target.value })}
                />
              </label>
              <label className="block">
                Transaction Date & Time
                <div className="mt-1 flex gap-2">
                  <input
                    type="datetime-local"
                    required
                    className={`${input} min-w-0 flex-1`}
                    value={editTxForm.date}
                    onChange={(e) => setEditTxForm({ ...editTxForm, date: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setEditTxForm({ ...editTxForm, date: toLocalDatetimeInput() })}
                    className={`${btnGhost} px-3 text-xs`}
                  >
                    Now
                  </button>
                </div>
              </label>
              <label className="block">
                Status
                <select
                  className={`${input} mt-1 w-full`}
                  value={editTxForm.status}
                  onChange={(e) => setEditTxForm({ ...editTxForm, status: e.target.value as TxStatus })}
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Flagged">Flagged</option>
                  <option value="Reversed">Reversed</option>
                </select>
              </label>
              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-3">
                <button type="button" className={btnGhost} onClick={() => setEditingTx(null)}>Cancel</button>
                <button type="submit" className={btnPrimary}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Localized>
  );
}

function AccountsList({
  accs,
  onCreditDebit,
}: {
  accs: typeof accounts;
  onCreditDebit?: (accId: string, kind: "credit" | "debit") => void;
}) {
  if (!accs.length) return <Localized><Empty title="No accounts" text="This customer has no open accounts." /></Localized>;
  return (
    <Localized>
      <ul className="space-y-3">
        {accs.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary p-4">
            <div>
              <p className="font-medium">{a.type}</p>
              <p className="text-xs text-muted-foreground">{a.number} · Restrictions: {a.restriction}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-lg font-semibold tabular-nums">
                {money(a.balance, a.currency)}
              </span>
              <StatusBadge s={a.status} />
              {onCreditDebit && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onCreditDebit(a.id, "credit")}
                    className={`${btnGhost} h-8 px-2.5 text-xs text-success hover:border-success`}
                    title="Credit this account"
                  >
                    + Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreditDebit(a.id, "debit")}
                    className={`${btnGhost} h-8 px-2.5 text-xs text-destructive hover:border-destructive`}
                    title="Debit this account"
                  >
                    − Debit
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Localized>
  );
}
