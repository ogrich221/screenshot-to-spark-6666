import { Localized } from "@/components/localized";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Phone,
  Mail,
  Trash2,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { PageHeader, Panel, Empty, StatusBadge, btnPrimary, btnGhost, input } from "@/components/admin/ui";
import { PasswordInput } from "@/components/ui/password-input";
import {
  createUser,
  deleteUser,
  listUsers,
  postTransaction,
  updateUserProfile,
  type AdminUser,
} from "@/lib/admin-users.functions";
import { loadAdminData } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & Profiles — Lumen Bank Admin" },
      { name: "description", content: "Manage customer logins, edit profiles, and credit/debit accounts." },
      { property: "og:title", content: "Users & Profiles — Lumen Bank Admin" },
      { property: "og:description", content: "Manage customer logins, edit profiles, and credit/debit accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsersPage,
});

const money = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

function toLocalDatetimeInput(d?: string | Date) {
  const date = d ? new Date(d) : new Date();
  if (isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function str(d: Record<string, unknown> | undefined, k: string): string {
  if (!d) return "";
  const v = d[k];
  return typeof v === "string" ? v : "";
}

function UsersPage() {
  loadAdminData();
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const remove = useServerFn(deleteUser);
  const updateProfile = useServerFn(updateUserProfile);
  const postTx = useServerFn(postTransaction);

  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [confirm, setConfirm] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    citizenship: "",
    address: "",
    city: "",
    region: "",
    postal: "",
    country: "",
    accountStatus: "Active",
  });

  const [transactUser, setTransactUser] = useState<AdminUser | null>(null);
  const [txForm, setTxForm] = useState({
    kind: "credit" as "credit" | "debit",
    amount: "",
    narration: "",
    date: "",
  });

  const openEditProfile = (u: AdminUser) => {
    setEditingUser(u);
    const d = u.details ?? {};
    const parts = (u.name || "").split(" ");
    const fallbackFirst = parts[0] || "";
    const fallbackLast = parts.slice(1).join(" ") || "";

    setProfileForm({
      firstName: str(d, "firstName") || fallbackFirst,
      lastName: str(d, "lastName") || fallbackLast,
      email: u.email,
      phone: str(d, "phone") || u.phone || "",
      dob: str(d, "dob"),
      citizenship: str(d, "citizenship"),
      address: str(d, "address"),
      city: str(d, "city"),
      region: str(d, "region"),
      postal: str(d, "postal"),
      country: str(d, "country"),
      accountStatus: u.accountStatus || "Active",
    });
  };

  const openCreditDebit = (u: AdminUser, kind: "credit" | "debit" = "credit") => {
    setTransactUser(u);
    setTxForm({
      kind,
      amount: "",
      narration: kind === "credit" ? "Account Credit / Deposit" : "Account Debit / Withdrawal",
      date: toLocalDatetimeInput(),
    });
  };

  const add = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: (r) => {
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(`User ${form.email} created. Share the password with them securely.`);
      setForm({ name: "", email: "", password: "" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Check details: valid email and password >= 8 chars."),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (r) => {
      setConfirm(null);
      if (!r.ok) { toast.error(r.error); return; }
      toast.success("User deleted.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Could not delete user."),
  });

  const saveProfileMutation = useMutation({
    mutationFn: () => {
      if (!editingUser) throw new Error("No user selected");
      return updateProfile({
        data: {
          id: editingUser.id,
          ...profileForm,
        },
      });
    },
    onSuccess: (r) => {
      if (!r.ok) { toast.error(r.error); return; }
      toast.success("Customer profile updated successfully.");
      setEditingUser(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Could not update profile."),
  });

  const txMutation = useMutation({
    mutationFn: () => {
      if (!transactUser) throw new Error("No user selected");
      return postTx({
        data: {
          userId: transactUser.id,
          kind: txForm.kind,
          amount: txForm.amount,
          narration: txForm.narration,
          date: txForm.date ? new Date(txForm.date).toISOString() : undefined,
        },
      });
    },
    onSuccess: (r) => {
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(`${txForm.kind === "credit" ? "Credited" : "Debited"} ${money(Number(txForm.amount))}. New balance: ${money(r.balance)}.`);
      setTransactUser(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-ledger"] });
      qc.invalidateQueries({ queryKey: ["my-transactions"] });
    },
    onError: () => toast.error("Check amount, narration, and date."),
  });

  const allUsers = users.data ?? [];
  const filteredUsers = allUsers.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <Localized>
      <PageHeader
        crumbs={[{ label: "Overview", to: "/admin" }, { label: "Users & Profiles" }]}
        title="Users & Profiles"
        sub="Manage customer profiles, edit user information, view balances, and directly credit or debit accounts."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create user */}
        <Panel title="Create customer login" className="lg:col-span-1">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
            <label className="block text-sm">
              Full name
              <input
                required
                placeholder="Jane Doe"
                className={`${input} mt-1 w-full`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Email
              <input
                required
                type="email"
                placeholder="user@example.com"
                className={`${input} mt-1 w-full`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Temporary password
              <PasswordInput
                required
                minLength={8}
                className="mt-1"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              At least 8 characters. The user can sign in immediately.
            </p>
            <button disabled={add.isPending} className={`${btnPrimary} w-full`}>
              <UserPlus className="h-4 w-4" />
              {add.isPending ? "Creating…" : "Create customer login"}
            </button>
          </form>
        </Panel>

        {/* All users list */}
        <Panel title={`All users (${allUsers.length})`} className="lg:col-span-2">
          <div className="mb-4">
            <input
              placeholder="Search users by name, email, or phone…"
              className={`${input} h-9 w-full text-xs`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {users.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading users…</p>
          ) : users.error ? (
            <p className="text-sm text-destructive">Could not load users.</p>
          ) : !filteredUsers.length ? (
            <Empty title="No users found" text="Create a customer login or adjust your search filter." />
          ) : (
            <ul className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-xs text-primary">
                        {(u.name || u.email)[0]?.toUpperCase()}
                      </span>
                      <p className="truncate font-semibold text-foreground">
                        {u.name || "No name yet"}
                        {u.isAdmin && <span className="ml-2"><StatusBadge s="Administrator" /></span>}
                      </p>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1" data-no-translate>
                        <Mail className="h-3 w-3" /> {u.email}
                      </span>
                      {u.phone && (
                        <span className="flex items-center gap-1" data-no-translate>
                          <Phone className="h-3 w-3" /> {u.phone}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-primary">
                        <Wallet className="h-3.5 w-3.5" />
                        Balance: {money(u.balance)}
                      </span>
                      <StatusBadge s={u.accountStatus || (u.confirmed ? "Active" : "Unconfirmed")} />
                      <span className="text-muted-foreground">
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions for each user */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!u.isAdmin && (
                      <button
                        onClick={() => openCreditDebit(u, "credit")}
                        className={`${btnGhost} h-9 px-3 text-xs font-semibold text-success hover:border-success`}
                        title="Credit or debit this user's balance"
                      >
                        <ArrowDownLeft className="h-3.5 w-3.5" /> Credit/Debit
                      </button>
                    )}

                    <button
                      onClick={() => openEditProfile(u)}
                      className={`${btnGhost} h-9 px-3 text-xs font-semibold`}
                      title="Edit customer details and profile"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                    </button>

                    {!u.isAdmin && (
                      <button
                        onClick={() => setConfirm(u)}
                        className={`${btnGhost} h-9 px-3 text-xs hover:border-destructive hover:text-destructive`}
                        aria-label={`Delete ${u.email}`}
                        title="Delete user account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Edit Profile Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-display text-xl font-semibold">Edit Customer Profile</h2>
                <p className="text-xs text-muted-foreground">
                  Update customer information for <span data-no-translate className="font-semibold text-foreground">{editingUser.email}</span>.
                </p>
              </div>
              <button onClick={() => setEditingUser(null)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="mt-5 space-y-4 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                saveProfileMutation.mutate();
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  First name
                  <input
                    required
                    className={`${input} mt-1 w-full`}
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Last name
                  <input
                    required
                    className={`${input} mt-1 w-full`}
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Email address
                  <input
                    required
                    type="email"
                    className={`${input} mt-1 w-full`}
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Phone number
                  <input
                    placeholder="+1 555 0199"
                    className={`${input} mt-1 w-full`}
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Date of birth
                  <input
                    type="date"
                    className={`${input} mt-1 w-full`}
                    value={profileForm.dob}
                    onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Citizenship / Country
                  <input
                    placeholder="United States"
                    className={`${input} mt-1 w-full`}
                    value={profileForm.citizenship}
                    onChange={(e) => setProfileForm({ ...profileForm, citizenship: e.target.value, country: e.target.value })}
                  />
                </label>
              </div>

              <div className="border-t border-border pt-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address Details</h3>
                <div className="space-y-3">
                  <label className="block text-sm">
                    Street Address
                    <input
                      placeholder="123 Financial Way"
                      className={`${input} mt-1 w-full`}
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block text-sm">
                      City
                      <input
                        placeholder="New York"
                        className={`${input} mt-1 w-full`}
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      />
                    </label>
                    <label className="block text-sm">
                      Region / State
                      <input
                        placeholder="NY"
                        className={`${input} mt-1 w-full`}
                        value={profileForm.region}
                        onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                      />
                    </label>
                    <label className="block text-sm">
                      Postal Code
                      <input
                        placeholder="10001"
                        className={`${input} mt-1 w-full`}
                        value={profileForm.postal}
                        onChange={(e) => setProfileForm({ ...profileForm, postal: e.target.value })}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <label className="block text-sm">
                  Account Status
                  <select
                    className={`${input} mt-1 w-full`}
                    value={profileForm.accountStatus}
                    onChange={(e) => setProfileForm({ ...profileForm, accountStatus: e.target.value })}
                  >
                    <option value="Active">Active / Approved</option>
                    <option value="Verified">Verified</option>
                    <option value="Review needed">Review needed</option>
                    <option value="Temporarily restricted">Temporarily restricted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                <button type="button" className={btnGhost} onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveProfileMutation.isPending}
                  className={btnPrimary}
                >
                  {saveProfileMutation.isPending ? "Saving changes…" : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Credit / Debit Modal */}
      {transactUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Credit or Debit User</h2>
                <p className="text-xs text-muted-foreground">
                  Post a transaction for <span data-no-translate className="font-semibold text-foreground">{transactUser.name || transactUser.email}</span>.
                </p>
              </div>
              <button onClick={() => setTransactUser(null)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="mt-4 space-y-4 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                txMutation.mutate();
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                {(["credit", "debit"] as const).map((k) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setTxForm({ ...txForm, kind: k })}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                      txForm.kind === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
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
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                Narration / Description
                <textarea
                  required
                  maxLength={200}
                  rows={2}
                  placeholder="e.g. Wire deposit, Direct payment, Adjustment"
                  className={`${input} mt-1 h-auto py-2 w-full`}
                  value={txForm.narration}
                  onChange={(e) => setTxForm({ ...txForm, narration: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                Transaction Date & Time
                <div className="mt-1 flex gap-2">
                  <input
                    type="datetime-local"
                    className={`${input} min-w-0 flex-1`}
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, date: toLocalDatetimeInput() })}
                    className={`${btnGhost} px-3 text-xs`}
                  >
                    Now
                  </button>
                </div>
              </label>

              {Number(txForm.amount) > 0 && (
                <div className="rounded-xl bg-secondary p-3 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Current balance:</span>
                    <span className="font-medium text-foreground">{money(transactUser.balance)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span>Projected balance:</span>
                    <span className="font-semibold text-primary">
                      {money(transactUser.balance + (txForm.kind === "credit" ? 1 : -1) * Number(txForm.amount))}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                <button type="button" className={btnGhost} onClick={() => setTransactUser(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={txMutation.isPending || !Number(txForm.amount) || !txForm.narration.trim()}
                  className={btnPrimary}
                >
                  {txMutation.isPending ? "Posting…" : txForm.kind === "credit" ? "Credit user" : "Debit user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Delete this user?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <span data-no-translate>{confirm.email}</span> will lose access, and their profile and account will be removed.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setConfirm(null)}>Cancel</button>
              <button disabled={del.isPending} className={`${btnPrimary} bg-destructive`} onClick={() => del.mutate(confirm.id)}>
                {del.isPending ? "Deleting…" : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Localized>
  );
}
