import { Localized } from '@/components/localized';
import { DashboardBackdrop } from '@/components/dashboard-backdrop';
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin } from "@/lib/admin-users.functions";
import { adminPasscodeLogin } from "@/lib/admin-login.functions";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Bell, ChevronsLeft, ChevronsRight, CreditCard, FileBarChart, HelpCircle, Home, LayoutDashboard, LifeBuoy,
  Lock, Menu, Search, Settings, ShieldAlert, ArrowLeftRight, Users, UserCog, Wallet, X, ArrowLeft,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { alerts } from "@/lib/admin-data";
import { StatusBadge } from "@/components/admin/ui";
import { useLocale } from '@/lib/locale';

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
  { to: "/admin/users", label: "Users", icon: UserCog },
  { to: "/admin/cards", label: "Cards", icon: CreditCard },
  { to: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function Logo({ small }: { small?: boolean }) {
  return (
    <Localized><Link to="/admin" className="flex items-center gap-2 font-display font-bold tracking-wider">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold shadow-glow"><span className="h-2.5 w-2.5 rounded-full bg-background" /></span>
      {!small && <span className="whitespace-nowrap">LUMEN <span className="text-primary">BANK</span></span>}
    </Link></Localized>
  );
}

function NavList({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  return (
    <Localized><nav aria-label="Admin" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} onClick={onNav} title={collapsed ? label : undefined}
          activeOptions={{ exact: to === "/admin" }}
          className="flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-secondary text-primary ring-1 ring-primary/40" }}>
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          {!collapsed && <span>{label}</span>}
        </Link>
      ))}
    </nav></Localized>
  );
}

function AdminLayout() {
  const check = useServerFn(checkAdmin);
  const [gate, setGate] = useState<"loading" | "signedOut" | "denied" | "ok">("loading");
  const [email, setEmail] = useState("");
  useEffect(() => {
    let live = true;
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { if (live) setGate("signedOut"); return; }
      setEmail(data.user.email ?? "");
      try { const r = await check(); if (live) setGate(r.isAdmin ? "ok" : "denied"); } catch { if (live) setGate("denied"); }
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN" || e === "SIGNED_OUT") run(); });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, [check]);
  if (gate !== "ok") return <AdminGate state={gate} />;
  return <AdminShell email={email} />;
}

function PasscodeForm() {
  const login = useServerFn(adminPasscodeLogin);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="mt-6 space-y-4 text-left" onSubmit={async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await login({ data: { passcode } });
      if (!r.ok) setError(r.error);
      else { setPasscode(""); await supabase.auth.setSession({ access_token: r.accessToken, refresh_token: r.refreshToken }); }
    } catch { setError("Could not sign in. Please try again."); }
    setBusy(false);
  }}>
    <label className="block text-sm" htmlFor="admin-passcode">Passcode<PasswordInput id="admin-passcode" autoComplete="current-password" required maxLength={128} value={passcode} onChange={(e) => setPasscode(e.target.value)} className="mt-2 h-12" /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button disabled={busy || !passcode} className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
  </form>;
}

function AdminGate({ state }: { state: "loading" | "signedOut" | "denied" }) {
  return (
    <Localized><div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="mb-6 flex justify-center"><Logo /></div>
        {state === "loading" ? <p className="text-muted-foreground">Checking your access…</p> : state === "signedOut" ? <>
          <h1 className="font-display text-xl font-semibold">Administrator sign-in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your administrator passcode.</p>
          <PasscodeForm />
        </> : <>
          <h1 className="font-display text-xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">This account isn't the administrator.</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-6 inline-flex h-11 items-center rounded-full border border-border px-6 text-sm">Sign out</button>
        </>}
      </div>
    </div></Localized>
  );
}

function AdminShell({ email }: { email: string }) {
  const { lang, setLang } = useLocale();
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
    <Localized><div className="dashboard-workspace flex min-h-screen w-full bg-background">
      <DashboardBackdrop />
      <Toaster position="top-center" theme="dark" richColors />
      {/* Desktop sidebar */}
      <aside className={`dashboard-chrome sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar p-4 transition-all lg:flex ${collapsed ? "w-20" : "w-64"}`}>
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
          <div className="dashboard-chrome absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-sidebar p-4 animate-in slide-in-from-left">
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
        <header className="dashboard-chrome sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <button onClick={() => setMobile(true)} aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-full bg-secondary lg:hidden"><Menu className="h-5 w-5" /></button>
          {!isRoot && (
            <button onClick={() => window.history.back()} aria-label="Go back" className="grid h-11 w-11 place-items-center rounded-full border border-border lg:hidden"><ArrowLeft className="h-5 w-5" /></button>
          )}
          <p className="truncate font-semibold lg:hidden">{current.label}</p>
          <form className="relative hidden flex-1 md:block md:max-w-md" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/admin/users" }); }}>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="gsearch" className="sr-only">Search customers</label>
            <input id="gsearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers, accounts, cases…"
              className="h-11 w-full rounded-full border border-border bg-secondary pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="admin-language">Language</label>
            <select id="admin-language" value={lang} onChange={e => { const value = e.target.value; if (value === 'en' || value === 'fr' || value === 'es' || value === 'de' || value === 'pt') setLang(value); }} className="h-9 rounded-md border border-border bg-secondary px-2 text-xs"><option value="en">EN</option><option value="fr">FR</option><option value="es">ES</option><option value="de">DE</option><option value="pt">PT</option></select>
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
              <button onClick={() => { setProfile(!profile); setBell(false); }} aria-label="Profile menu" aria-expanded={profile} className="grid h-11 w-11 place-items-center rounded-full bg-gold font-semibold text-primary-foreground">{(email[0] ?? "A").toUpperCase()}</button>
              {profile && (
                <div className="absolute right-0 top-14 z-50 w-56 rounded-3xl border border-border bg-popover p-2 shadow-soft">
                  <div className="px-3 py-2"><p className="truncate font-semibold" data-no-translate>{email}</p><p className="text-xs text-muted-foreground">Administrator</p></div>
                  <Link to="/admin/settings" onClick={() => setProfile(false)} className="block rounded-2xl px-3 py-2.5 text-sm hover:bg-secondary">Settings</Link>
                  <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }} className="block w-full rounded-2xl px-3 py-2.5 text-left text-sm hover:bg-secondary">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 md:px-8 lg:pb-12">
          <div className="mx-auto max-w-7xl"><Outlet /></div>
        </main>

        {/* Mobile bottom nav */}
        <nav aria-label="Quick" className="dashboard-chrome fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          {NAV.filter((n) => ["Overview", "Customers", "Transactions", "Support cases", "Compliance"].includes(n.label)).map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/admin" }} className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
              <Icon className="h-5 w-5" />{label.replace("Support cases", "Cases")}
            </Link>
          ))}
        </nav>
      </div>
    </div></Localized>
  );
}
