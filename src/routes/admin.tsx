import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell, ChevronsLeft, ChevronsRight, CreditCard, FileBarChart, HelpCircle, Home, LayoutDashboard, LifeBuoy,
  Lock, Menu, Search, Settings, ShieldAlert, ArrowLeftRight, Users, Wallet, X, ArrowLeft,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { alerts } from "@/lib/admin-data";
import { StatusBadge } from "@/components/admin/ui";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Lumen Bank" },
      { name: "description", content: "Lumen Bank operations workspace for customers, accounts, transactions and compliance." },
      { property: "og:title", content: "Lumen Bank Admin" },
      { property: "og:description", content: "A clear, secure operations workspace for Lumen Bank teams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

export const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/accounts", label: "Accounts", icon: Wallet },
  { to: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/admin/cards", label: "Cards", icon: CreditCard },
  { to: "/admin/cases", label: "Support cases", icon: LifeBuoy },
  { to: "/admin/compliance", label: "Compliance", icon: ShieldAlert },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function Logo({ small }: { small?: boolean }) {
  return (
    <Link to="/admin" className="flex items-center gap-2 font-display font-bold tracking-wider">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold shadow-glow"><span className="h-2.5 w-2.5 rounded-full bg-background" /></span>
      {!small && <span className="whitespace-nowrap">LUMEN <span className="text-primary">BANK</span></span>}
    </Link>
  );
}

function NavList({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} onClick={onNav} title={collapsed ? label : undefined}
          activeOptions={{ exact: to === "/admin" }}
          className="flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-secondary text-primary ring-1 ring-primary/40" }}>
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          {!collapsed && <span>{label}</span>}
        </Link>
      ))}
    </nav>
  );
}

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [bell, setBell] = useState(false);
  const [profile, setProfile] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = [...NAV].reverse().find((n) => path.startsWith(n.to)) ?? NAV[0];
  const isRoot = path === "/admin" || path === "/admin/";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Toaster position="top-center" theme="dark" richColors />
      {/* Desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar p-4 transition-all lg:flex ${collapsed ? "w-20" : "w-64"}`}>
        <div className="mb-8 px-1"><Logo small={collapsed} /></div>
        <NavList collapsed={collapsed} />
        <div className="mt-auto space-y-2">
          <Link to="/" className="flex h-11 items-center gap-3 rounded-2xl px-3 text-sm text-muted-foreground hover:text-foreground"><Home className="h-5 w-5" />{!collapsed && "Public website"}</Link>
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
            {collapsed ? <ChevronsRight className="h-5 w-5" /> : <><ChevronsLeft className="h-5 w-5" /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* Mobile slide-out */}
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-sidebar p-4 animate-in slide-in-from-left">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobile(false)} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-full bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <NavList onNav={() => setMobile(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <button onClick={() => setMobile(true)} aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-full bg-secondary lg:hidden"><Menu className="h-5 w-5" /></button>
          {!isRoot && (
            <button onClick={() => window.history.back()} aria-label="Go back" className="grid h-11 w-11 place-items-center rounded-full border border-border lg:hidden"><ArrowLeft className="h-5 w-5" /></button>
          )}
          <p className="truncate font-semibold lg:hidden">{current.label}</p>
          <form className="relative hidden flex-1 md:block md:max-w-md" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/admin/customers", search: { q, status: "All" } }); }}>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="gsearch" className="sr-only">Search customers</label>
            <input id="gsearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers, accounts, cases…"
              className="h-11 w-full rounded-full border border-border bg-secondary pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-xs font-semibold text-success sm:inline-flex" title="Your session is encrypted and expires after 15 minutes of inactivity">
              <Lock className="h-3.5 w-3.5" /> Secure session
            </span>
            <Link to="/admin/settings" aria-label="Help" className="hidden h-11 w-11 place-items-center rounded-full hover:bg-secondary sm:grid"><HelpCircle className="h-5 w-5" /></Link>
            <div className="relative">
              <button onClick={() => { setBell(!bell); setProfile(false); }} aria-label="Notifications" aria-expanded={bell} className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-secondary">
                <Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive" />
              </button>
              {bell && (
                <div className="absolute right-0 top-14 z-50 w-80 rounded-3xl border border-border bg-popover p-3 shadow-soft">
                  <p className="px-2 pb-2 text-sm font-semibold">Notifications</p>
                  {alerts.slice(0, 4).map((a) => (
                    <Link key={a.id} to="/admin/compliance" onClick={() => setBell(false)} className="block rounded-2xl p-3 hover:bg-secondary">
                      <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{a.title}</p><StatusBadge s={a.level} /></div>
                      <p className="mt-1 text-xs text-muted-foreground">{a.time}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => { setProfile(!profile); setBell(false); }} aria-label="Profile menu" aria-expanded={profile} className="grid h-11 w-11 place-items-center rounded-full bg-gold font-semibold text-primary-foreground">AR</button>
              {profile && (
                <div className="absolute right-0 top-14 z-50 w-56 rounded-3xl border border-border bg-popover p-2 shadow-soft">
                  <div className="px-3 py-2"><p className="font-semibold">Alex Rivera</p><p className="text-xs text-muted-foreground">Administrator</p></div>
                  <Link to="/admin/settings" onClick={() => setProfile(false)} className="block rounded-2xl px-3 py-2.5 text-sm hover:bg-secondary">Settings</Link>
                  <Link to="/" className="block rounded-2xl px-3 py-2.5 text-sm hover:bg-secondary">Sign out</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 md:px-8 lg:pb-12">
          <div className="mx-auto max-w-7xl"><Outlet /></div>
        </main>

        {/* Mobile bottom nav */}
        <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          {NAV.filter((n) => ["Overview", "Customers", "Transactions", "Support cases", "Compliance"].includes(n.label)).map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/admin" }} className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
              <Icon className="h-5 w-5" />{label.replace("Support cases", "Cases")}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
