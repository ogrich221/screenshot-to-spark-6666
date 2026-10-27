import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, CreditCard, Wifi, Smartphone, Zap, Droplets, Flame, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Localized } from '@/components/localized';
import { transferPreview } from '@/lib/transfer-preview';

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const billTypes = [['Electricity', Zap], ['Water', Droplets], ['Gas', Flame], ['Internet & phone', Wifi]] as const;

export function CustomerCards({ name, email }: { name: string; email: string }) {
  return <Localized><section className="mt-8 border-t border-border pt-7">
    <div className="mb-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><CreditCard className="size-5 text-primary" />Your credit cards</h2><span className="text-xs text-muted-foreground">Not issued</span></div>
    <div className="grid gap-5 md:grid-cols-2">
      {(['Physical card', 'Virtual card'] as const).map((type, index) => <article key={type} className="min-w-0">
        <div className={`relative flex aspect-[1.586] w-full max-w-md flex-col justify-between overflow-hidden rounded-lg border border-primary/30 p-5 sm:p-6 ${index === 0 ? 'bg-gold text-primary-foreground' : 'bg-sidebar text-foreground'}`}>
          <div className="flex items-center justify-between gap-3"><span className="font-display text-sm font-bold" translate="no">LUMEN BANK</span>{index === 0 ? <Wifi className="size-5 rotate-90" /> : <Smartphone className="size-5 text-primary" />}</div>
          <div><CreditCard className="mb-2 size-8" /><p className="font-mono text-lg sm:text-xl" aria-label="Card number not issued">•••• •••• •••• ••••</p></div>
          <div className="flex min-w-0 items-end justify-between gap-3"><div className="min-w-0"><p className="text-[10px] uppercase">Cardholder</p><p className="truncate text-sm font-semibold" data-no-translate>{name}</p></div><span className="shrink-0 text-xs">{type}</span></div>
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span className="break-all" data-no-translate>{email}</span><span>Card design preview</span></div>
      </article>)}
    </div>
    <p className="mt-4 text-xs text-muted-foreground">No card number, credit limit or expiry has been issued.</p>
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
  const start = (bill: string) => { setType(bill); setProvider(''); setReference(''); setAmount(''); setStep('details'); setOpen(true); };
  const review = (event: FormEvent) => { event.preventDefault(); if (provider.trim() && reference.trim() && preview.valid && preview.withinLimit) setStep('review'); };
  return <Localized><section className="mt-8 border-t border-border pt-7">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><Receipt className="size-5 text-primary" />Utility bills</h2>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{billTypes.map(([label, Icon]) => <Button key={label} variant="outline" className="h-24 flex-col gap-3 whitespace-normal text-center" onClick={() => start(label)}><Icon className="size-5 text-primary" />{label}</Button>)}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="profile-theme max-h-[90dvh] overflow-y-auto rounded-lg"><DialogHeader>
      <div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Back" onClick={() => step === 'details' ? setOpen(false) : setStep(step === 'summary' ? 'review' : 'details')}><ArrowLeft /></Button><DialogTitle>{step === 'details' ? 'Utility bill payment' : step === 'review' ? 'Review bill' : 'Bill preview summary'}</DialogTitle></div>
      <DialogDescription>Preview only. No money is sent.</DialogDescription>
    </DialogHeader>
    {step === 'details' ? <form onSubmit={review} className="space-y-4">
      <label className="block text-sm" htmlFor="bill-type">Bill type<select id="bill-type" value={type} onChange={e => setType(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-input bg-background px-3">{billTypes.map(([label]) => <option key={label} value={label}>{label}</option>)}</select></label>
      <label className="block text-sm" htmlFor="bill-provider">Service provider<Input id="bill-provider" required maxLength={120} value={provider} onChange={e => setProvider(e.target.value)} className="mt-2 h-12" /></label>
      <label className="block text-sm" htmlFor="bill-reference">Customer or bill reference<Input id="bill-reference" required maxLength={100} value={reference} onChange={e => setReference(e.target.value)} className="mt-2 h-12" /></label>
      <label className="block text-sm" htmlFor="bill-amount">Bill amount (USD)<Input id="bill-amount" required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="mt-2 h-12" /></label>
      {amount && (!preview.valid || !preview.withinLimit) && <p role="alert" className="text-sm text-destructive">Enter an amount greater than zero with up to two decimal places.</p>}
      <Button type="submit" className="h-12 w-full" disabled={!provider.trim() || !reference.trim() || !preview.valid || !preview.withinLimit}>Review bill<ArrowUpRight /></Button>
    </form> : <>
      {step === 'summary' && <div role="status" className="flex gap-3 rounded-md border border-success/30 bg-success/10 p-4 text-success"><CheckCircle2 className="size-5 shrink-0" /><div><p className="font-semibold">Your preview is ready.</p><p className="mt-1 text-sm">No bill has been paid. Your balance is unchanged.</p></div></div>}
      <dl className="space-y-4 py-3 text-sm">{[['Bill type', type], ['Service provider', provider], ['Customer or bill reference', reference]].map(([label, value]) => <div key={label} className="flex justify-between gap-5"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[60%] break-words text-right" data-no-translate={label !== 'Bill type'}>{value}</dd></div>)}
        <div className="flex justify-between gap-4"><dt>Bill amount (USD)</dt><dd>{money(preview.amount)}</dd></div>
        <div className="flex justify-between gap-4"><dt>Available balance</dt><dd>{money(availableBalance)}</dd></div>
        <div className="flex justify-between gap-4 border-t border-border pt-4"><dt>{preview.sufficient ? 'Estimated balance after payment' : 'Balance unchanged'}</dt><dd className="font-semibold text-primary">{money(preview.remainingBalance)}</dd></div>
      </dl>
      {!preview.sufficient && <p className="text-sm text-warning">Insufficient funds. No money will be sent.</p>}
      <Button className="h-12" onClick={() => step === 'review' ? setStep('summary') : setOpen(false)}>{step === 'review' ? 'View preview summary' : 'Done'}</Button>
    </>}
    </DialogContent></Dialog>
  </section></Localized>;
}