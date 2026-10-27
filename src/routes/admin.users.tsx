import { Localized } from "@/components/localized";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { PageHeader, Panel, Empty, StatusBadge, btnPrimary, btnGhost, input } from "@/components/admin/ui";
import { PasswordInput } from "@/components/ui/password-input";
import { createUser, deleteUser, listUsers, type AdminUser } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Lumen Bank Admin" }, { name: "description", content: "Create and remove Lumen Bank customer logins." }, { property: "og:title", content: "Users — Lumen Bank Admin" }, { property: "og:description", content: "Manage customer logins." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const remove = useServerFn(deleteUser);
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [confirm, setConfirm] = useState<AdminUser | null>(null);

  const add = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: (r) => {
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(`User ${form.email} created. Share the password with them securely.`);
      setForm({ name: "", email: "", password: "" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Check the details: valid email and a password of at least 8 characters."),
  });
  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (r) => {
      setConfirm(null);
      if (!r.ok) { toast.error(r.error); return; }
      toast.success("User deleted.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Could not delete the user."),
  });

  return (
    <Localized>
      <PageHeader crumbs={[{ label: "Overview", to: "/admin" }, { label: "Users" }]} title="Users" sub="Real customer logins. Create a login with a temporary password, or permanently delete one." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Create user" className="lg:col-span-1">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
            <label className="block text-sm">Full name<input required className={`${input} mt-1 w-full`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="block text-sm">Email<input required type="email" className={`${input} mt-1 w-full`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="block text-sm">Temporary password
              <PasswordInput required minLength={8} className="mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>
            <p className="text-xs text-muted-foreground">At least 8 characters. The user can sign in straight away and change it later.</p>
            <button disabled={add.isPending} className={`${btnPrimary} w-full`}><UserPlus className="h-4 w-4" />{add.isPending ? "Creating…" : "Create user"}</button>
          </form>
        </Panel>
        <Panel title="All users" className="lg:col-span-2">
          {users.isLoading ? <p className="text-sm text-muted-foreground">Loading users…</p>
            : users.error ? <p className="text-sm text-destructive">Could not load users.</p>
            : !users.data?.length ? <Empty title="No users yet" text="Create the first login on the left." />
            : <ul className="divide-y divide-border">
                {users.data.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{u.name || "No name yet"} {u.isAdmin && <StatusBadge s="Administrator" />}</p>
                      <p className="truncate text-xs text-muted-foreground" data-no-translate>{u.email}</p>
                      <p className="text-xs text-muted-foreground">Joined {new Date(u.createdAt).toLocaleDateString()} · {u.accountStatus ? `Account ${u.accountStatus}` : "No account opened"}{!u.confirmed && " · Email not confirmed"}</p>
                    </div>
                    {!u.isAdmin && <button onClick={() => setConfirm(u)} className={`${btnGhost} hover:border-destructive hover:text-destructive`} aria-label={`Delete ${u.email}`}><Trash2 className="h-4 w-4" />Delete</button>}
                  </li>
                ))}
              </ul>}
        </Panel>
      </div>
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-border bg-popover p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Delete this user?</h2>
            <p className="mt-2 text-sm text-muted-foreground"><span data-no-translate>{confirm.email}</span> will lose access, and their profile and account application will be removed. This can't be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setConfirm(null)}>Cancel</button>
              <button disabled={del.isPending} className={`${btnPrimary} bg-destructive`} onClick={() => del.mutate(confirm.id)}>{del.isPending ? "Deleting…" : "Delete user"}</button>
            </div>
          </div>
        </div>
      )}
    </Localized>
  );
}
