import { Localized } from '@/components/localized';
import { TransferPreview } from '@/components/transfer-preview';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Wallet, ShieldCheck, ArrowUpRight, CheckCircle2, Eye, EyeOff, LogOut, Home, Mail, Phone, MapPin, User, CreditCard, LifeBuoy, PiggyBank, Clock } from 'lucide-react';
import { readCustomer } from '@/lib/onboarding.functions';
import { supabase } from '@/integrations/supabase/client';
import { useT } from '@/components/site';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const customerQuery = queryOptions({ queryKey: ['customer-account'], queryFn: () => readCustomer() });
export const Route = createFileRoute('/_authenticated/dashboard')({ loader: ({ context }) => context.queryClient.ensureQueryData(customerQuery), head: () => ({ meta: [{ title: 'My account — LUMEN BANK' }, { name: 'description', content: 'Your LUMEN customer profile, balances and security overview.' }, { property: 'og:title', content: 'My account — LUMEN BANK' }, { property: 'og:description', content: 'Your private customer account overview.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }), component: Page });

const str = (d: unknown, k: string) => (d && typeof d === 'object' && !Array.isArray(d) && typeof (d as Record<string, unknown>)[k] === 'string' ? (d as Record<string, string>)[k] : '');

function Page() {
  const { data } = useSuspenseQuery(customerQuery);
  const { lang, setLang } = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [deposit, setDeposit] = useState(false);
  const [show, setShow] = useState(false);
  const d = data.profile?.details;
  const first = str(d, 'firstName'), last = str(d, 'lastName');
  const name = [first, last].filter(Boolean).join(' ') || 'LUMEN customer';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || 'L';
  const address = [str(d, 'address'), str(d, 'city'), str(d, 'region'), str(d, 'postal')].filter(Boolean).join(', ');
  const money = (n: number) => show ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '$••••••';
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({ to: '/auth', replace: true }); };
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return <Localized><>
    <header className="sticky top-0 z-40 border-b border-border bg-sidebar/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <Link to="/" className="font-display text-sm font-bold tracking-widest text-gold" translate="no">LUMEN BANK</Link>
        <div className="flex items-center gap-2">
          <select aria-label="Language" value={lang} onChange={e => setLang(e.target.value as typeof lang)} className="h-9 rounded-md border border-border bg-background px-2 text-xs">{['EN', 'FR', 'ES', 'DE', 'PT'].map(l => <option key={l} value={l}>{l}</option>)}</select>
          <Button asChild variant="ghost" size="sm"><Link to="/"><Home />Home</Link></Button>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut />Sign out</Button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-5 py-10">
      <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-gold font-display text-xl font-bold text-primary-foreground">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{greet},</p>
          <h1 className="truncate text-2xl font-semibold sm:text-3xl" data-no-translate>{name}</h1>
          <p className="mt-1 truncate text-sm text-muted-foreground" data-no-translate>{data.email}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-primary"><ShieldCheck className="size-4" />{data.account ? 'Member' : 'Application in progress'}</span>
      </section>

      {!data.account ? <div className="mt-8 rounded-2xl border border-border p-8"><h2 className="text-xl font-semibold">Your next step is waiting.</h2><p className="mt-3 text-muted-foreground">Finish your saved application to open your LUMEN account.</p><Button asChild className="mt-6 h-12"><Link to="/open-account">Continue application<ArrowUpRight /></Link></Button></div> :
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="flex gap-2 font-semibold"><Wallet className="size-5 text-primary" />LUMEN account</span>
              <div className="flex items-center gap-3"><span className="flex gap-1 text-xs text-success"><CheckCircle2 className="size-4" />{data.account.status}</span>
                <button onClick={() => setShow(s => !s)} aria-label={show ? 'Hide balances' : 'Show balances'} aria-pressed={show} className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-primary">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
            </div>
            <dl className="mt-8 grid gap-5 sm:grid-cols-2">
              <div><dt className="text-sm text-muted-foreground">Available balance</dt><dd className="mt-2 text-3xl font-semibold text-primary">{money(data.account.available_balance)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Current balance</dt><dd className="mt-2 text-3xl font-semibold">{money(data.account.current_balance)}</dd></div>
            </dl>
            <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">Application account · Banking services not connected</p>
            <div className="mt-5 flex flex-wrap gap-3"><TransferPreview availableBalance={data.account.available_balance} /><Button variant="outline" className="h-12" onClick={() => setDeposit(true)}>Add money<ArrowUpRight /></Button></div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Quick links</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {([['/cards', CreditCard, 'Cards'], ['/savings', PiggyBank, 'Savings & Goals'], ['/security', ShieldCheck, 'Security Centre'], ['/support', LifeBuoy, 'Help & Support']] as const).map(([to, Icon, l]) =>
                <li key={to}><Link to={to} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-secondary"><Icon className="size-4 text-primary" />{l}</Link></li>)}
            </ul>
          </div>
        </div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-semibold"><User className="size-5 text-primary" />Personal details</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            {([[User, 'Full name', name], [Mail, 'Email', data.email], [Phone, 'Phone', str(d, 'phone') || 'Not added'], [MapPin, 'Address', address || 'Not added']] as const).map(([Icon, l, v]) =>
              <div key={l} className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><dt className="text-muted-foreground">{l}</dt><dd className="mt-0.5 break-words font-medium" data-no-translate>{v}</dd></div></div>)}
          </dl>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-5 text-primary" />Account security</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex justify-between"><span>Email</span><span className={data.emailVerified ? 'text-success' : 'text-warning'}>{data.emailVerified ? 'Verified' : 'Unverified'}</span></li>
            <li className="flex justify-between"><span>Phone</span><span className={data.phoneVerified ? 'text-success' : 'text-muted-foreground'}>{data.phoneVerified ? 'Verified' : 'Unverified'}</span></li>
            <li className="flex justify-between"><span>Transfer PIN</span><span className={data.account ? 'text-success' : 'text-muted-foreground'}>{data.account ? 'Set' : 'Not set'}</span></li>
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-5 w-full"><Link to="/reset-password">Change password</Link></Button>
          <p className="mt-4 text-xs text-muted-foreground">Never share your password, transfer PIN or security answers.</p>
        </section>
      </div>

      {data.account && <section className="mt-6 rounded-2xl border border-border bg-card p-6"><h2 className="flex items-center gap-2 font-semibold"><Clock className="size-5 text-primary" />Recent activity</h2><p className="mt-4 text-sm text-muted-foreground">Your account is open. No transactions yet.</p></section>}

      <Dialog open={deposit} onOpenChange={setDeposit}><DialogContent><DialogHeader><DialogTitle>Add money</DialogTitle><DialogDescription>Deposits will be available once banking services and identity verification are connected. No money can be added yet.</DialogDescription></DialogHeader><Button onClick={() => setDeposit(false)}>Got it</Button></DialogContent></Dialog>
    </main>
  </></Localized>;
}
