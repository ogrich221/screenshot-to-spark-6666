import { Localized } from '@/components/localized';
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, MailWarning, UserPlus, Users, UserCheck } from "lucide-react";
import { listUsers, type AdminUser } from "@/lib/admin-users.functions";
import { PageHeader, Panel, StatusBadge, btnPrimary, btnGhost } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Overview — Lumen Bank Admin" }, { name: "description", content: "Manage Lumen Bank customer logins and applications." }, { property: "og:title", content: "Overview — Lumen Bank Admin" }, { property: "og:description", content: "Manage Lumen Bank customer logins and applications." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Overview,
});

const day = 86400000;
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never";

function Overview() {
  const fetchUsers = useServerFn(listUsers);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const users: AdminUser[] = (data ?? []).filter((u) => !u.isAdmin);
  const now = Date.now();
  const stats = [
    { label: "Total customers", value: users.length, icon: Users, note: "Customer logins on Lumen" },
    { label: "Accounts opened", value: users.filter((u) => u.accountStatus).length, icon: UserCheck, note: "Finished account opening" },
    { label: "Applications in progress", value: users.filter((u) => u.confirmed && !u.accountStatus).length, icon: Clock, note: "Signed up, not finished yet" },
    { label: "Unconfirmed emails", value: users.filter((u) => !u.confirmed).length, icon: MailWarning, note: "Waiting for email confirmation" },
    { label: "New this week", value: users.filter((u) => now - new Date(u.createdAt).getTime() < 7 * day).length, icon: UserPlus, note: "Joined in the last 7 days" },
    { label: "Active this week", value: users.filter((u) => u.lastSignIn && now - new Date(u.lastSignIn).getTime() < 7 * day).length, icon: CheckCircle2, note: "Signed in in the last 7 days" },
  ];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <Localized><>
      <PageHeader crumbs={[{ label: "Dashboard" }]} title={`${greet}, LUMENBANK CEO`} sub="Manage customer logins and account applications in one place."
        actions={<>
          <Link to="/admin/users" className={btnGhost}><Users className="h-4 w-4" />All users</Link>
          <Link to="/admin/users" className={btnPrimary}><UserPlus className="h-4 w-4" />Create user</Link>
        </>} />

      {error && <p className="mb-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">Could not load users. Refresh the page to try again.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{s.label}</p><s.icon className="h-5 w-5 text-primary" /></div>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums">{isLoading ? "—" : s.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </div>

      <Panel title="Newest customers" className="mt-6" action={<Link to="/admin/users" className="text-sm font-semibold text-primary">Manage users</Link>}>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customers yet. Create the first one from the Users page.</p>
        ) : (
          <ul className="divide-y divide-border">
            {users.slice(0, 8).map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-primary">{(u.name || u.email)[0]?.toUpperCase()}</span>
                  <div className="min-w-0"><p className="truncate font-medium">{u.name || "No name yet"}</p><p className="truncate text-sm text-muted-foreground" data-no-translate>{u.email}</p></div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Joined {fmt(u.createdAt)}</span>
                  <StatusBadge s={u.accountStatus ? "Active" : u.confirmed ? "Pending" : "Unconfirmed"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </></Localized>
  );
}
