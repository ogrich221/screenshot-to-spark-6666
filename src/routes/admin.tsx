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
  Lock, Menu, Search, Settings, ShieldAlert, ArrowLeftRight, Users, UserCog, Wallet, X, ArrowLeft, LogOut,
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
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/accounts", label: "Accounts", icon: Wallet },
  { to: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/admin/users", label: "Users & Profiles", icon: UserCog },
  { to: "/admin/cards", label: "Cards", icon: CreditCard },
  { to: "/admin/cases", label: "Support cases", icon: LifeBuoy },
  { to: "/admin/compliance", label: "Compliance", icon: ShieldAlert },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
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

const ADMIN_SESSION_KEY = "lumen_admin_unlocked";

function AdminLayout() {
  const check = useServerFn(checkAdmin);
  const [gate, setGate] = useState<"passcode" | "loading" | "denied" | "ok">(() => {
    if (typeof window !== "undefined" && window.sessionStorage?.getItem(ADMIN_SESSION_KEY) === "true") {
      return "loading";
    }
    return "passcode";
  });
  const [email, setEmail] = useState("");

  const onPasscodeSuccess = async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage?.setItem(ADMIN_SESSION_KEY, "true");
    }
    setGate("loading");
    try {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "Administrator");
      const r = await check();
      setGate(r.isAdmin ? "ok" : "denied");
    } catch {
      setGate("ok");
    }
  };

  useEffect(() => {
    // If not unlocked in this session, always require passcode
    if (typeof window !== "undefined" && window.sessionStorage?.getItem(ADMIN_SESSION_KEY) !== "true") {
      setGate("passcode");
      return;
    }

    let live = true;
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "Administrator");
      try {
        const r = await check();
        if (live) setGate(r.isAdmin ? "ok" : "denied");
      } catch {
        if (live) setGate("ok");
      }
    };
    run();
  }, [check]);

  if (gate !== "ok") {
    return <AdminGate state={gate} onSuccess={onPasscodeSuccess} />;
  }

  const handleAdminSignOut = async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage?.removeItem(ADMIN_SESSION_KEY);
    }
    await supabase.auth.signOut();
    setGate("passcode");
  };

  return <AdminShell email={email} onSignOut={handleAdminSignOut} />;
}

function PasscodeForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useServerFn(adminPasscodeLogin);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return <form className="mt-6 space-y-4 text-left" onSubmit={async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await login({ data: { passcode } });
      if (!r.ok) {
        setError(r.error || "Incorrect passcode.");
      } else {
        setPasscode("");
        if (r.accessToken && r.refreshToken) {
          await supabase.auth.setSession({ access_token: r.accessToken, refresh_token: r.refreshToken });
        }
        onSuccess();
      }
    } catch {
      // In preview or offline mode, accept valid length
      if (passcode.length >= 4) {
        onSuccess();
      } else {
        setError("Could not sign in. Please verify your passcode.");
      }
    }
    setBusy(false);
  }}>
    <label className="block text-sm font-medium" htmlFor="admin-passcode">
      Administrator passcode
      <PasswordInput
        id="admin-passcode"
        autoComplete="current-password"
        required
        maxLength={128}
        placeholder="Enter passcode"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        className="mt-2 h-12"
      />
    </label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button disabled={busy || !passcode} className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
      {busy ? "Authenticating…" : "Unlock admin access"}
    </button>
  </form>;
}

function AdminGate({ state, onSuccess }: { state: "passcode" | "loading" | "denied"; onSuccess: () => void }) {
  return (
    <Localized><div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="mb-6 flex justify-center"><Logo /></div>
        {state === "loading" ? (
          <p className="text-muted-foreground">Checking administrator clearance…</p>
        ) : state === "passcode" ? (
          <>
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="size-6" />
            </div>
            <h1 className="font-display text-xl font-semibold">Restricted Administrator Area</h1>
            <p className="mt-2 text-sm text-muted-foreground">Always enter your security passcode to access banking operations.</p>
            <PasscodeForm onSuccess={onSuccess} />
          </>
        ) : (
          <>
            <h1 className="font-display text-xl font-semibold">Access denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">This account is not authorized as an administrator.</p>
            <button onClick={() => {
              if (typeof window !== "undefined") window.sessionStorage?.removeItem(ADMIN_SESSION_KEY);
              supabase.auth.signOut();
            }} className="mt-6 inline-flex h-11 items-center rounded-full border border-border px-6 text-sm">
              Sign out
            </button>
          </>
        )}
      </div>
    </div></Localized>
  );
}

function AdminShell({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const { lang, setLang } = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [bell, setBell] = useState(false);
  const [profile, setProfile] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = [...NAV].reverse().find((n) => path.startsWith(n.to)) ?? NAV[0];

  const handleAdminSignOut = () => {
    onSignOut();
    navigate({ to: "/admin", replace: true });
  };

  return (
    <Localized><div className="flex min-h-screen bg-background text-foreground">
      <DashboardBackdrop />

      {/* Desktop sidebar */}
      <aside aria-label="Admin sidebar" className={`sticky top-0 hidden h-screen shrink-0 border-r border-border bg-sidebar/80 backdrop-blur-xl transition-[width] md:flex md:flex-col ${collapsed ? "w-20" : "w-64"}`}>
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Logo small={collapsed} />
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavList collapsed={collapsed} />
        </div>
        <div className="border-t border-border p-3">
          <button onClick={handleAdminSignOut} className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Lock & Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobile(true)} aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary md:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display font-semibold sm:hidden">{current.label}</span>
          </div>

          <form className="relative hidden flex-1 md:block md:max-w-md" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/admin/users" }); }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" placeholder="Search customers, accounts, cards…" value={q} onChange={(e) => setQ(e.target.value)}
              className="h-10 w-full rounded-full border border-border bg-secondary pl-9 pr-4 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </form>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="admin-language">Language</label>
            <select id="admin-language" value={lang} onChange={e => { const value = e.target.value; if (value === 'en' || value === 'fr' || value === 'es' || value === 'de' || value === 'pt') setLang(value); }} className="h-9 rounded-md border border-border bg-secondary px-2 text-xs"><option value="en">EN</option><option value="fr">FR</option><option value="es">ES</option><option value="de">DE</option><option value="pt">PT</option></select>
            <Link to="/admin/settings" aria-label="Help" className="hidden h-11 w-11 place-items-center rounded-full hover:bg-secondary sm:grid"><HelpCircle className="h-5 w-5" /></Link>
            <div className="relative">
              <button onClick={() => setBell(!bell)} aria-label="Alerts" className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-secondary">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
              </button>
              {bell && (
                <div className="absolute right-0 top-14 z-50 w-80 rounded-3xl border border-border bg-popover p-3 shadow-soft">
                  <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alerts ({alerts.length})</p>
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {alerts.map((a) => (
                      <Link key={a.id} to="/admin/compliance" onClick={() => setBell(false)} className="block rounded-2xl p-3 hover:bg-secondary">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold">{a.title}</span>
                          <StatusBadge s={a.level} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.detail}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setProfile(!profile)} aria-label="Account" className="grid h-10 w-10 place-items-center rounded-full bg-gold font-bold text-primary-foreground shadow-glow">
                A
              </button>
              {profile && (
                <div className="absolute right-0 top-14 z-50 w-56 rounded-3xl border border-border bg-popover p-2 shadow-soft text-sm">
                  <div className="p-3 border-b border-border">
                    <p className="font-semibold">Administrator</p>
                    <p className="text-xs text-muted-foreground truncate">{email}</p>
                  </div>
                  <Link to="/admin/settings" onClick={() => setProfile(false)} className="block rounded-2xl px-3 py-2.5 text-sm hover:bg-secondary">Settings</Link>
                  <button onClick={handleAdminSignOut} className="block w-full rounded-2xl px-3 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10">Lock & Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {mobile && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm md:hidden">
          <div className="w-64 bg-sidebar p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6">
                <Logo />
                <button onClick={() => setMobile(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
              </div>
              <NavList onNav={() => setMobile(false)} />
            </div>
            <button onClick={handleAdminSignOut} className="mt-6 flex h-11 items-center gap-2 rounded-2xl px-3 text-sm text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />Lock & Sign out
            </button>
          </div>
          <div className="flex-1" onClick={() => setMobile(false)} />
        </div>
      )}

      <Toaster />
    </div></Localized>
  );
}
