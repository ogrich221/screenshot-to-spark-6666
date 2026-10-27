import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Download, Info, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Localized } from '@/components/localized';
import { useLocale } from '@/lib/locale';
import { translate } from '@/lib/translate';
import { transferPreview } from '@/lib/transfer-preview';

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function TransferPreview({ availableBalance }: { availableBalance: number }) {
  const { lang } = useLocale();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'details' | 'review' | 'summary'>('details');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const preview = transferPreview(availableBalance, amount);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recipient.trim() && preview.valid && preview.withinLimit) setStep('review');
  }

  function download() {
    const t = (text: string) => translate(text, lang);
    const text = [
      'LUMEN BANK', t('Transfer preview summary'), t('Preview only. No money has been sent. This is not a payment receipt.'),
      `${t('Recipient')}: ${recipient.trim()}`, `${t('Transfer amount')}: ${money(preview.amount)}`,
      `${t('Available balance')}: ${money(availableBalance)}`,
      `${t(preview.sufficient ? 'Estimated balance after transfer' : 'Balance unchanged')}: ${money(preview.remainingBalance)}`,
      `${t('Reference or note')}: ${reference.trim() || '—'}`,
      `${t('Fees and delivery time')}: ${t('Not available until banking services are connected.')}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LUMEN-transfer-preview.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <Localized><>
    <Button className="h-12" onClick={() => { setStep('details'); setRecipient(''); setAmount(''); setReference(''); setOpen(true); }}>Send money<ArrowUpRight /></Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{step === 'details' ? 'Plan a transfer' : step === 'review' ? 'Review transfer' : 'Transfer preview summary'}</DialogTitle>
          <DialogDescription>Preview only. Transfers are not available until banking services are connected.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border pb-4 text-xs text-muted-foreground" aria-label="Transfer progress">
          <span className={step === 'details' ? 'text-primary' : ''}>1 · Details</span><ArrowUpRight className="size-3" />
          <span className={step === 'review' ? 'text-primary' : ''}>2 · Review</span><ArrowUpRight className="size-3" />
          <span className={step === 'summary' ? 'text-primary' : ''}>3 · Summary</span>
        </div>
        {step === 'details' ? <form onSubmit={review} className="space-y-5">
          <label className="block text-sm font-medium" htmlFor="transfer-recipient">Recipient full name<Input id="transfer-recipient" className="mt-2 h-12" required maxLength={100} value={recipient} onChange={event => setRecipient(event.target.value)} /></label>
          <label className="block text-sm font-medium" htmlFor="transfer-amount">Transfer amount (USD)<Input id="transfer-amount" className="mt-2 h-12" required inputMode="decimal" placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)} aria-describedby="transfer-amount-help" aria-invalid={Boolean(amount && (!preview.valid || !preview.withinLimit))} /></label>
          <p id="transfer-amount-help" className="text-xs text-muted-foreground">You can send up to $5,000,000 a day. Terms and conditions apply.</p>
          {amount && !preview.valid && <p role="alert" className="text-sm text-destructive">Enter an amount greater than zero with up to two decimal places.</p>}
          {preview.valid && !preview.withinLimit && <p role="alert" className="text-sm text-destructive">The amount exceeds the $5,000,000 daily limit. Terms and conditions apply.</p>}
          <label className="block text-sm font-medium" htmlFor="transfer-reference">Reference or note<Input id="transfer-reference" className="mt-2 h-12" maxLength={140} value={reference} onChange={event => setReference(event.target.value)} /></label>
          <BalanceImpact availableBalance={availableBalance} amount={amount} />
          <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" className="h-12" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="h-12" disabled={!recipient.trim() || !preview.valid || !preview.withinLimit}>Review transfer<ArrowUpRight /></Button></div>
        </form> : <>
          {step === 'summary' && <div role="status" className="flex gap-3 rounded-md border border-success/30 bg-success/10 p-4 text-success"><CheckCircle2 className="size-5 shrink-0" /><div><p className="font-semibold">Your preview is ready.</p><p className="mt-1 text-sm">No money has been sent. Your account balance is unchanged.</p></div></div>}
          <dl className="space-y-4 border-b border-border py-3 text-sm">
            <div className="flex justify-between gap-5"><dt className="text-muted-foreground">Recipient</dt><dd className="max-w-[65%] break-words text-right" data-no-translate>{recipient.trim()}</dd></div>
            <div className="flex justify-between gap-5"><dt className="text-muted-foreground">Transfer amount</dt><dd>{money(preview.amount)}</dd></div>
            {reference.trim() && <div className="flex justify-between gap-5"><dt className="text-muted-foreground">Reference or note</dt><dd className="max-w-[65%] break-words text-right" data-no-translate>{reference.trim()}</dd></div>}
            <div><dt className="text-muted-foreground">Fees and delivery time</dt><dd className="mt-1">Not available until banking services are connected.</dd></div>
          </dl>
          <BalanceImpact availableBalance={availableBalance} amount={amount} />
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Info className="size-4 shrink-0" />Preview only. No money has been sent. This is not a payment receipt.</p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" className="h-12" onClick={() => step === 'review' ? setStep('details') : setOpen(false)}>{step === 'review' ? <><ArrowLeft />Edit details</> : 'Done'}</Button>
            {step === 'review' ? <Button className="h-12" onClick={() => setStep('summary')}>View preview summary<ArrowUpRight /></Button> : <Button className="h-12" onClick={download}><Download />Download summary</Button>}
          </div>
        </>}
      </DialogContent>
    </Dialog>
  </></Localized>;
}

function BalanceImpact({ availableBalance, amount }: { availableBalance: number; amount: string }) {
  const result = transferPreview(availableBalance, amount);
  return <Localized><div className="border-y border-border py-4" aria-live="polite">
    <div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Wallet className="size-4" />Available balance</span><span>{money(availableBalance)}</span></div>
    <div className="mt-3 flex items-center justify-between gap-4"><span className="text-sm">{result.sufficient ? 'Estimated balance after transfer' : 'Balance unchanged'}</span><span className="shrink-0 text-xl font-semibold text-primary">{money(result.remainingBalance)}</span></div>
    {result.valid && result.withinLimit && !result.sufficient && <p className="mt-3 text-sm text-warning">Insufficient funds. No money will be sent.</p>}
    {result.shortfall > 0 && <div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground"><span>Additional funds needed</span><span>{money(result.shortfall)}</span></div>}
    {result.sufficient && <p className="mt-3 text-xs text-muted-foreground">Amount only. Any applicable fees must be included before a real payment.</p>}
  </div></Localized>;
}