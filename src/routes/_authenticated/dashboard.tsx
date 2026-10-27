import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { myTransactions } from '@/lib/admin-users.functions';
import { Localized } from '@/components/localized';
import { BackLink } from '@/components/back-link';
import { TransferPreview } from '@/components/transfer-preview';
import { CustomerCards, UtilityBills } from '@/components/profile-payments';
import { createFileRoute, Link, useNavigate, redirect } from '@tanstack/react-router';
import { checkAdmin } from '@/lib/admin-users.functions';
import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Wallet, ShieldCheck, ArrowLeft, ArrowUpRight, CheckCircle2, Eye, EyeOff, LogOut, Home, Mail, User, CreditCard, LifeBuoy, PiggyBank, Clock, Menu, Receipt, Landmark, HandCoins, type LucideIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AvatarEditor, AvatarImage, useAvatar } from '@/components/profile-avatar';
import type { ReactNode } from 'react';
import { readCustomer } from '@/lib/onboarding.functions';
import { supabase } from '@/integrations/supabase/client';
import { useT } from '@/components/site';
import { Button } from '@/components/ui/button';

const customerQuery = queryOptions({ queryKey: ['customer-account'], queryFn: () => readCustomer() });
export const Route = createFileRoute('/_authenticated/dashboard')({ beforeLoad: async () => { const r = await checkAdmin().catch(() => ({ isAdmin: false })); if (r.isAdmin) throw redirect({ to: '/admin', replace: true }); }, loader: ({ context }) => context.queryClient.ensureQueryData(customerQuery), head: () => ({ meta: [{ title: 'My account — LUMEN BANK' }, { name: 'description', content: 'Your LUMEN customer profile, balances and security overview.' }, { property: 'og:title', content: 'My account — LUMEN BANK' }, { property: 'og:description', content: 'Your private customer account overview.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }), component: Page });

const str = (d: unknown, k: string) => (d && typeof d === 'object' && !Array.isArray(d) && typeof (d as Record<string, unknown>)[k] === 'string' ? (d as Record<string, string>)[k] : '');

function Page() {
  const { data } = useSuspenseQuery(customerQuery);
  const { lang, setLang } = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [menu, setMenu] = useState(false);
  const avatar = useAvatar();
  const d = data.profile?.details;
  const first = str(d, 'firstName'), last = str(d, 'lastName');
  const name = [first, last].filter(Boolean).join(' ') || 'LUMEN customer';
  const initials = ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || 'L';
  const address = [str(d, 'address'), str(d, 'city'), str(d, 'region'), str(d, 'postal')].filter(Boolean).join(', ');
  const money = (n: number) => show ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '$••••••';
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({ to: '/auth', replace: true }); };
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return <Localized><div className="profile-theme min-h-dvh bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border bg-sidebar/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" onClick={() => setMenu(true)} aria-label="Open profile menu" className="flex items-center gap-2 rounded-full border border-border h-10 p-1 pr-3 transition hover:border-primary">
            <AvatarImage url={avatar.url} initials={initials} className="size-8 text-xs" />
            <Menu className="size-4 text-primary" />
          </Button>
          <Link to="/" className="truncate font-display text-sm font-bold tracking-widest text-gold" translate="no">LUMEN BANK</Link>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Language" value={lang} onChange={e => setLang(e.target.value as typeof lang)} className="h-9 rounded-md border border-border bg-background px-2 text-xs">{['en', 'fr', 'es', 'de', 'pt'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/"><Home />Home</Link></Button>
          <Button variant="outline" size="sm" onClick={signOut} aria-label="Sign out"><LogOut /><span className="hidden sm:inline">Sign out</span></Button>
        </div>
      </div>
    </header>
    <Sheet open={menu} onOpenChange={setMenu}>
      <SheetContent side="left" className="profile-theme w-[88vw] overflow-y-auto sm:max-w-md">
        <SheetHeader><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={() => setMenu(false)} aria-label="Back to my account" title="Back to my account"><ArrowLeft /></Button><SheetTitle>My profile</SheetTitle></div></SheetHeader>
        <div className="mt-6 space-y-6 px-1 pb-8">
          <AvatarEditor avatar={avatar} initials={initials} />
        <section className="border-b border-border pb-6">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-5 text-primary" />Account security</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex justify-between"><span>Email</span><span className={data.emailVerified ? 'text-success' : 'text-warning'}>{data.emailVerified ? 'Verified' : 'Unverified'}</span></li>
            <li className="flex justify-between"><span>Phone</span><span className={data.phoneVerified ? 'text-success' : 'text-muted-foreground'}>{data.phoneVerified ? 'Verified' : 'Unverified'}</span></li>
            <li className="flex justify-between"><span>Transfer PIN</span><span className={data.account ? 'text-success' : 'text-muted-foreground'}>{data.account ? 'Set' : 'Not set'}</span></li>
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-5 w-full"><Link to="/reset-password" onClick={() => setMenu(false)}>Change password</Link></Button>
          <p className="mt-4 text-xs text-muted-foreground">Never share your password, transfer PIN or security answers.</p>
        </section>
          <ProfileGroup icon={User} title="Personal details" rows={[['Full name', name], ['Date of birth', str(d, 'dob') || 'Not added'], ['Citizenship', str(d, 'citizenship') || 'Not added']]} />
          <ProfileGroup icon={Mail} title="Contact details" rows={[['Email', data.email], ['Phone', str(d, 'phone') || 'Not added'], ['Address', address || 'Not added']]} />
          <ProfileGroup icon={Receipt} title="Tax" rows={[['Tax residency', str(d, 'citizenship') || 'Not added'], ['Tax documents', 'None yet'], ['Annual statement', 'Available after your first full tax year']]} />
          <ProfileGroup icon={Landmark} title="Loans" rows={[['Active loans', 'None'], ['Rates', 'From 5.5% APR']]} action={<Link to="/loans" onClick={() => setMenu(false)} className="text-sm font-semibold text-primary hover:underline">Explore loans →</Link>} />
          <ProfileGroup icon={HandCoins} title="Grants" rows={[['Applications', 'None'], ['Eligible programmes', 'None available yet']]} action={<Link to="/support" onClick={() => setMenu(false)} className="text-sm font-semibold text-primary hover:underline">Ask about grants →</Link>} />
        </div>
      </SheetContent>
    </Sheet>
    <main className="mx-auto max-w-6xl px-5 py-6">
      <div className="mb-4"><BackLink home /></div>
      <section className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-center">
        <AvatarImage url={avatar.url} initials={initials} className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{greet},</p>
          <h1 className="truncate text-2xl font-semibold sm:text-3xl" data-no-translate>{name}</h1>
          <p className="mt-1 truncate text-sm text-muted-foreground" data-no-translate>{data.email}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-primary"><ShieldCheck className="size-4" />{data.account ? 'Member' : 'Application in progress'}</span>
      </section>

      {!data.account ? <div className="mt-8 border-b border-border py-8"><h2 className="text-xl font-semibold">Your next step is waiting.</h2><p className="mt-3 text-muted-foreground">Finish your saved application to open your LUMEN account.</p><Button asChild className="mt-6 h-12"><Link to="/open-account">Continue application<ArrowUpRight /></Link></Button></div> :
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="py-2 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="flex gap-2 font-semibold"><Wallet className="size-5 text-primary" />LUMEN account</span>
              <div className="flex items-center gap-3"><span className="flex gap-1 text-xs text-success"><CheckCircle2 className="size-4" />{data.account.status}</span>
                <Button variant="outline" size="icon" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide balances' : 'Show balances'} aria-pressed={show} className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-primary">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></div>
            </div>
            <dl className="mt-8">
              <div><dt className="text-sm text-muted-foreground">Available balance</dt><dd className="mt-2 text-3xl font-semibold text-primary">{money(data.account.available_balance)}</dd></div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5"><TransferPreview availableBalance={data.account.available_balance} domestic /><TransferPreview availableBalance={data.account.available_balance} international /></div>
          </div>
          <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-2">
            <h2 className="font-semibold">Quick links</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {([['/cards', CreditCard, 'Cards'], ['/savings', PiggyBank, 'Savings & Goals'], ['/security', ShieldCheck, 'Security Centre'], ['/support', LifeBuoy, 'Help & Support']] as const).map(([to, Icon, l]) =>
                <li key={to}><Link to={to} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-secondary"><Icon className="size-4 text-primary" />{l}</Link></li>)}
            </ul>
          </div>
        </div>}

      <CustomerCards name={name} email={data.email} />
      {data.account && <UtilityBills availableBalance={data.account.available_balance} />}
      {data.account && <RecentActivity show={show} />}
    </main>
  </div></Localized>;
}

function ProfileGroup({ icon: Icon, title, rows, action }: { icon: LucideIcon; title: string; rows: [string, string][]; action?: ReactNode }) {
  return <section className="border-b border-border pb-5">
    <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-primary" />{title}</h3>
    <dl className="mt-3 space-y-2 text-sm">{rows.map(([l, v]) => <div key={l} className="flex justify-between gap-4"><dt className="text-muted-foreground">{l}</dt><dd className="break-words text-right font-medium" data-no-translate>{v}</dd></div>)}</dl>
    {action && <div className="mt-3">{action}</div>}
  </section>;
}

function RecentActivity({ show }: { show: boolean }) {
  const tx = useQuery({ queryKey: ['my-transactions'], queryFn: useServerFn(myTransactions) });
  const fmt = (v: number) => show ? v.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '$••••••';
  return <section className="mt-8 border-t border-border py-7"><h2 className="flex items-center gap-2 font-semibold"><Clock className="size-5 text-primary" />Recent activity</h2>
    {!tx.data?.length ? <p className="mt-4 text-sm text-muted-foreground">Your account is open. No transactions yet.</p>
      : <ul className="mt-4 divide-y divide-border">{tx.data.map(t => <li key={t.id} className="flex items-center justify-between gap-4 py-3 text-sm">
          <div className="min-w-0"><p className="truncate font-medium" data-no-translate>{t.narration}</p><p className="text-xs text-muted-foreground">{t.kind === 'credit' ? 'Credit' : 'Debit'} · {new Date(t.createdAt).toLocaleString()} · <span className={t.status === 'pending' ? 'text-warning' : t.status === 'declined' ? 'text-destructive' : 'text-success'}>{t.status === 'pending' ? 'Pending approval' : t.status === 'declined' ? 'Declined' : 'Completed'}</span></p>{t.reviewNote && <p className="text-xs text-muted-foreground" data-no-translate>{t.reviewNote}</p>}</div>
          <div className="shrink-0 text-right"><p className={`font-semibold ${t.status === 'declined' ? 'text-muted-foreground line-through' : t.kind === 'credit' ? 'text-success' : 'text-destructive'}`}>{t.kind === 'credit' ? '+' : '−'}{fmt(t.amount)}</p>{t.balanceAfter != null && <p className="text-xs text-muted-foreground">Balance {fmt(t.balanceAfter)}</p>}</div>
        </li>)}</ul>}
  </section>;
}
