import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, CreditCard, Wifi, Smartphone, Zap, Droplets, Flame, Receipt } from 'lucide-react';
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
    onSuccess: r => { if (!r.ok) { setError(r.error); return; } setError(''); setResult({ id: r.id, balance: availableBalance, paidAt: new Date().toLocaleString() }); setStep('summary'); qc.invalidateQueries({ queryKey: ['customer-account'] }); qc.invalidateQueries({ queryKey: ['my-transactions'] }); },
    onError: () => setError('The bill could not be paid. Please try again.'),
  });
  const start = (bill: string) => { setType(bill); setProvider(''); setReference(''); setAmount(''); setStep('details'); setResult(null); setError(''); setOpen(true); };
  const review = (event: FormEvent) => { event.preventDefault(); if (provider.trim() && reference.trim() && preview.valid && preview.withinLimit) setStep('review'); };
  return <Localized><section className="mt-8 border-t border-border pt-7">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><Receipt className="size-5 text-primary" />Utility bills</h2>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{billTypes.map(([label, Icon]) => <Button key={label} variant="outline" className="h-24 flex-col gap-3 whitespace-normal text-center" onClick={() => start(label)}><Icon className="size-5 text-primary" />{label}</Button>)}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="profile-theme max-h-[90dvh] overflow-y-auto rounded-lg"><DialogHeader>
      <div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Back" onClick={() => step === 'details' ? setOpen(false) : step === 'summary' ? setOpen(false) : setStep('details')}><ArrowLeft /></Button><DialogTitle>{step === 'details' ? 'Utility bill payment' : step === 'review' ? 'Review bill' : 'Payment submitted'}</DialogTitle></div>
      <DialogDescription>{step === 'summary' ? 'Awaiting approval. Your balance changes once it is approved.' : 'The amount is taken from your available balance when you confirm.'}</DialogDescription>
    </DialogHeader>
    {step === 'details' ? <form onSubmit={review} className="space-y-4">
      <label className="block text-sm" htmlFor="bill-type">Bill type<select id="bill-type" value={type} onChange={e => setType(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-input bg-background px-3">{billTypes.map(([label]) => <option key={label} value={label}>{label}</option>)}</select></label>
      <label className="block text-sm" htmlFor="bill-provider">Service provider<Input id="bill-provider" required maxLength={120} value={provider} onChange={e => setProvider(e.target.value)} className="mt-2 h-12" /></label>
      <label className="block text-sm" htmlFor="bill-reference">Customer or bill reference<Input id="bill-reference" required maxLength={100} value={reference} onChange={e => setReference(e.target.value)} className="mt-2 h-12" /></label>
      <label className="block text-sm" htmlFor="bill-amount">Bill amount (USD)<Input id="bill-amount" required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="mt-2 h-12" /></label>
      {amount && (!preview.valid || !preview.withinLimit) && <p role="alert" className="text-sm text-destructive">Enter an amount greater than zero with up to two decimal places.</p>}
      <Button type="submit" className="h-12 w-full" disabled={!provider.trim() || !reference.trim() || !preview.valid || !preview.withinLimit}>Review bill<ArrowUpRight /></Button>
    </form> : <>
      {step === 'summary' && <div role="status" className="flex gap-3 rounded-md border border-success/30 bg-success/10 p-4 text-success"><CheckCircle2 className="size-5 shrink-0" /><div><p className="font-semibold">Payment submitted</p><p className="mt-1 text-sm">It is awaiting approval.</p></div></div>}
      <dl className="space-y-4 py-3 text-sm">{[['Bill type', type], ['Service provider', provider], ['Customer or bill reference', reference]].map(([label, value]) => <div key={label} className="flex justify-between gap-5"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[60%] break-words text-right" data-no-translate={label !== 'Bill type'}>{value}</dd></div>)}
        <div className="flex justify-between gap-4"><dt>Bill amount (USD)</dt><dd>{money(preview.amount)}</dd></div>
        <div className="flex justify-between gap-4"><dt>Available balance</dt><dd>{money(availableBalance)}</dd></div>
        <div className="flex justify-between gap-4 border-t border-border pt-4"><dt>{result ? 'Available balance until approved' : preview.sufficient ? 'Balance after payment' : 'Balance unchanged'}</dt><dd className="font-semibold text-primary">{money(result ? result.balance : preview.remainingBalance)}</dd></div>
        {result && <><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Date</dt><dd data-no-translate>{result.paidAt}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Request number</dt><dd className="font-mono text-xs" data-no-translate>{result.id.slice(0, 8).toUpperCase()}</dd></div></>}
      </dl>
      {step === 'review' && !preview.sufficient && <p className="text-sm text-warning">Insufficient funds. Add money to your account before paying this bill.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="h-12" disabled={step === 'review' && (!preview.sufficient || submit.isPending)} onClick={() => step === 'review' ? submit.mutate() : setOpen(false)}>{step === 'review' ? submit.isPending ? 'Submitting…' : `Pay ${money(preview.amount)}` : 'Done'}</Button>
    </>}
    </DialogContent></Dialog>
  </section></Localized>;
}