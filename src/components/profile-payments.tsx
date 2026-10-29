import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, ThumbsUp, CreditCard, Wifi, Smartphone, Zap, Droplets, Flame, Receipt, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Localized } from '@/components/localized';
import { useServerFn } from '@tanstack/react-start';
import { myCards, requestDebit } from '@/lib/admin-users.functions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transferPreview } from '@/lib/transfer-preview';

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const billTypes = [['Electricity', Zap], ['Water', Droplets], ['Gas', Flame], ['Internet & phone', Wifi]] as const;

export function CustomerCards({ name, email }: { name: string; email: string }) {
  const cards = useQuery({ queryKey: ['my-cards'], queryFn: useServerFn(myCards) });
  const issued = cards.data ?? [];
  const shown = issued.length ? issued.map(c => ({ key: c.id, type: c.cardType === 'Physical' ? 'Physical card' : 'Virtual card', physical: c.cardType === 'Physical', holder: c.cardholderName, number: `•••• •••• •••• ${c.last4}`, expires: c.expires, limit: c.creditLimit, status: c.status }))
    : (['Physical card', 'Virtual card'] as const).map((type, i) => ({ key: type, type, physical: i === 0, holder: name, number: '•••• •••• •••• ••••', expires: null as string | null, limit: null as number | null, status: null as string | null }));
  return <Localized><section className="mt-8 border-t border-border pt-7">
    <div className="mb-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><CreditCard className="size-5 text-primary" />Your credit cards</h2><span className="text-xs text-muted-foreground">{issued.length ? `${issued.length} issued` : 'Not issued'}</span></div>
    <div className="grid gap-5 md:grid-cols-2">
      {shown.map(c => <article key={c.key} className="min-w-0">
        <div className={`relative flex aspect-[1.586] w-full max-w-md flex-col justify-between overflow-hidden rounded-lg border border-primary/30 p-5 sm:p-6 ${c.physical ? 'bg-gold text-primary-foreground' : 'bg-sidebar text-foreground'} ${c.status === 'Frozen' ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between gap-3"><span className="font-display text-sm font-bold" translate="no">LUMEN BANK</span>{c.physical ? <Wifi className="size-5 rotate-90" /> : <Smartphone className="size-5 text-primary" />}</div>
          <div><CreditCard className="mb-2 size-8" /><p className="font-mono text-lg sm:text-xl" data-no-translate>{c.number}</p></div>
          <div className="flex min-w-0 items-end justify-between gap-3"><div className="min-w-0"><p className="text-[10px] uppercase">Cardholder</p><p className="truncate text-sm font-semibold" data-no-translate>{c.holder}</p></div><div className="shrink-0 text-right text-xs">{c.expires && <p data-no-translate>{c.expires}</p>}<p>{c.type}</p></div></div>
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span className="break-all" data-no-translate>{email}</span><span>{c.status ? `${c.status} · limit ${money(c.limit ?? 0)}` : 'Card design preview'}</span></div>
      </article>)}
    </div>
    {!issued.length && <p className="mt-4 text-xs text-muted-foreground">No card has been issued yet.</p>}
  </section></Localized>;
}

export function UtilityBills({ availableBalance }: { availableBalance: number }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>('Electricity');
  const [provider, setProvider] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'details' | 'review' | 'summary'>('details');
  const preview = transferPreview(availableBalance, amount);
  const qc = useQueryClient();
  const pay = useServerFn(requestDebit);
  const [result, setResult] = useState<{ id: string; balance: number; paidAt: string } | null>(null);
  const [error, setError] = useState('');
  const submit = useMutation({
    mutationFn: () => pay({ data: { category: 'bill', amount, narration: `${type} bill — ${provider.trim()} (ref ${reference.trim()})`.slice(0, 200), details: { type, provider: provider.trim(), reference: reference.trim() } } }),
    onSuccess: r => {
      if (!r.ok) { setError(r.error); return; }
      setError('');
      setResult({ id: r.id, balance: preview.remainingBalance, paidAt: new Date().toLocaleString() });
      setStep('summary');
      qc.invalidateQueries({ queryKey: ['customer-account'] });
      qc.invalidateQueries({ queryKey: ['my-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-ledger'] });
    },
    onError: () => setError('The bill payment request could not be processed. Please try again.'),
  });
  const start = (bill: string) => { setType(bill); setProvider(''); setReference(''); setAmount(''); setStep('details'); setResult(null); setError(''); setOpen(true); };
  const review = (event: FormEvent) => { event.preventDefault(); if (provider.trim() && reference.trim() && preview.valid && preview.withinLimit) setStep('review'); };
  return <Localized><section className="mt-8 border-t border-border pt-7">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><Receipt className="size-5 text-primary" />Utility bills</h2>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{billTypes.map(([label, Icon]) => <Button key={label} variant="outline" className="dashboard-glass h-24 flex-col gap-3 whitespace-normal text-center" onClick={() => start(label)}><Icon className="size-5 text-primary" />{label}</Button>)}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="profile-theme max-h-[90dvh] overflow-y-auto rounded-lg"><DialogHeader>
      <div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Back" onClick={() => step === 'details' ? setOpen(false) : step === 'summary' ? setOpen(false) : setStep('details')}><ArrowLeft /></Button><DialogTitle>{step === 'details' ? 'Utility bill payment' : step === 'review' ? 'Review bill' : 'Payment Submitted'}</DialogTitle></div>
      <DialogDescription>{step === 'summary' ? 'Your bill payment has been debited and is awaiting administrator approval.' : 'The amount is immediately debited from your available balance upon confirmation.'}</DialogDescription>
    </DialogHeader>
    {step === 'details' ? <form onSubmit={review} className="space-y-4">
      <label className="block text-sm font-medium" htmlFor="bill-type">Bill type<select id="bill-type" value={type} onChange={e => setType(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-input bg-background px-3">{billTypes.map(([label]) => <option key={label} value={label}>{label}</option>)}</select></label>
      <label className="block text-sm font-medium" htmlFor="bill-provider">Service provider<Input id="bill-provider" required maxLength={120} value={provider} onChange={e => setProvider(e.target.value)} className="mt-2 h-12" /></label>
      <label className="block text-sm font-medium" htmlFor="bill-reference">Customer or bill reference<Input id="bill-reference" required maxLength={100} value={reference} onChange={e => setReference(e.target.value)} className="mt-2 h-12" /></label>
      <label className="block text-sm font-medium" htmlFor="bill-amount">Bill amount (USD)<Input id="bill-amount" required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="mt-2 h-12" /></label>
      {amount && (!preview.valid || !preview.withinLimit) && <p role="alert" className="text-sm text-destructive">Enter an amount greater than zero with up to two decimal places.</p>}
      <Button type="submit" className="h-12 w-full" disabled={!provider.trim() || !reference.trim() || !preview.valid || !preview.withinLimit}>Review bill<ArrowUpRight /></Button>
    </form> : <>
      {step === 'summary' && (
        <div role="status" className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/15 via-background to-primary/5 p-5 shadow-lg shadow-primary/10">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 text-slate-950 shadow-md ring-4 ring-primary/20">
              <ThumbsUp className="size-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Payment Submitted Successfully</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-500">
                  Pending Approval
                </span>
                <span className="text-xs text-muted-foreground">· Funds debited</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-snug">
                Your account was debited {money(preview.amount)}. The payment is pending final administrator clearance.
              </p>
            </div>
          </div>
        </div>
      )}

      <dl className="space-y-4 py-3 text-sm">{[['Bill type', type], ['Service provider', provider], ['Customer or bill reference', reference]].map(([label, value]) => <div key={label} className="flex justify-between gap-5"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[60%] break-words text-right font-medium" data-no-translate={label !== 'Bill type'}>{value}</dd></div>)}
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Bill amount (USD)</dt><dd className="font-semibold">{money(preview.amount)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Available balance before</dt><dd>{money(availableBalance)}</dd></div>
        <div className="flex justify-between gap-4 border-t border-border pt-4"><dt className="font-medium">Remaining available balance</dt><dd className="font-bold text-primary">{money(preview.remainingBalance)}</dd></div>
        {result && <><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Submitted At</dt><dd data-no-translate>{result.paidAt}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Request ID</dt><dd className="font-mono text-xs font-semibold" data-no-translate>{result.id.slice(0, 8).toUpperCase()}</dd></div></>}
      </dl>
      {step === 'review' && !preview.sufficient && <p className="text-sm text-destructive">Insufficient funds. Add money to your account before paying this bill.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="h-12 w-full" disabled={step === 'review' && (!preview.sufficient || submit.isPending)} onClick={() => step === 'review' ? submit.mutate() : setOpen(false)}>{step === 'review' ? submit.isPending ? 'Submitting…' : `Pay ${money(preview.amount)}` : 'Done'}</Button>
    </>}
    </DialogContent></Dialog>
  </section></Localized>;
}
