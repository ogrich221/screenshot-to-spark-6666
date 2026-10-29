import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { requestDebit } from '@/lib/admin-users.functions';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, ThumbsUp, Download, Globe, Landmark, Info, Wallet, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Localized } from '@/components/localized';
import { useLocale } from '@/lib/locale';
import { translate } from '@/lib/translate';
import { transferPreview } from '@/lib/transfer-preview';

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function TransferPreview({ availableBalance, international = false, domestic = false }: { availableBalance: number; international?: boolean; domestic?: boolean }) {
  const { lang } = useLocale();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'details' | 'review' | 'summary'>('details');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [bank, setBank] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [country, setCountry] = useState('');
  const [account, setAccount] = useState('');
  const [swift, setSwift] = useState('');
  const preview = transferPreview(availableBalance, amount);
  const qc = useQueryClient();
  const request = useServerFn(requestDebit);
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');

  const isFormValid =
    recipient.trim() &&
    preview.valid &&
    preview.withinLimit &&
    (!domestic || (bank.trim() && account.trim() && /^\d{9}$/.test(swift))) &&
    (!international || (bank.trim() && bankAddress.trim().length >= 5 && country.trim() && account.trim() && swift.trim()));

  const submit = useMutation({
    mutationFn: () => {
      const details: Record<string, string> = { recipient: recipient.trim(), ...(reference.trim() ? { reference: reference.trim() } : {}) };
      if (domestic) Object.assign(details, { bank: bank.trim(), routing: swift, account: account.trim() });
      if (international) Object.assign(details, { bank: bank.trim(), bankAddress: bankAddress.trim(), country: country.trim(), account: account.trim(), swift: swift.trim() });
      const label = international ? 'International wire' : 'Domestic transfer';
      return request({ data: { category: international ? 'international' : 'domestic', amount, narration: `${label} to ${recipient.trim()}${reference.trim() ? ` — ${reference.trim()}` : ''}`.slice(0, 200), details } });
    },
    onSuccess: r => {
      if (!r.ok) { setError(r.error); return; }
      setError('');
      setRequestId(r.id);
      setStep('summary');
      qc.invalidateQueries({ queryKey: ['my-transactions'] });
      qc.invalidateQueries({ queryKey: ['customer-account'] });
      qc.invalidateQueries({ queryKey: ['admin-ledger'] });
    },
    onError: () => setError('Your request could not be submitted. Please try again.'),
  });

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isFormValid) setStep('review');
  }

  function download() {
    const t = (text: string) => translate(text, lang);
    const text = [
      'LUMEN BANK', t('Transfer preview summary'), t('Transfer submitted — debited and awaiting administrator approval.'), `${t('Request number')}: ${requestId.slice(0, 8).toUpperCase()}`,
      `${t('Recipient')}: ${recipient.trim()}`, `${t('Transfer amount')}: ${money(preview.amount)}`,
      `${t('Previous available balance')}: ${money(availableBalance)}`,
      `${t('Debited balance')}: ${money(preview.remainingBalance)}`,
      `${t('Status')}: PENDING APPROVAL (Debited)`,
      `${t('Reference or note')}: ${reference.trim() || '—'}`,
      `${t('Fees and delivery time')}: ${t('Not quoted in this preview.')}`,
      ...(international ? [`${t('Transfer type')}: International wire transfer (USD)`, `${t('Bank name')}: ${bank.trim()}`, `${t('Recipient bank address')}: ${bankAddress.trim()}`, `${t('Bank country')}: ${country.trim()}`, `${t('IBAN or account number')}: ${account.trim()}`, `${t('SWIFT / BIC')}: ${swift.trim()}`] : []),
      ...(domestic ? [`${t('Transfer type')}: Domestic transfer (USD)`, `${t('Bank name')}: ${bank.trim()}`, `${t('Routing number')}: ${swift}`, `${t('Account number')}: ${account.trim()}`] : []),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LUMEN-transfer-preview.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <Localized><>
    <Button variant={international ? 'outline' : 'default'} className="h-12 whitespace-normal" onClick={() => { setStep('details'); setRecipient(''); setAmount(''); setReference(''); setBank(''); setBankAddress(''); setCountry(''); setAccount(''); setSwift(''); setRequestId(''); setError(''); setOpen(true); }}>{international ? <><Globe />International wire transfer</> : domestic ? <><Landmark />Domestic transfer</> : <>Send money<ArrowUpRight /></>}</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Back" title="Back" onClick={() => step === 'details' ? setOpen(false) : setStep(step === 'summary' ? 'review' : 'details')}><ArrowLeft /></Button><DialogTitle>{step === 'details' ? international ? 'International wire transfer' : domestic ? 'Domestic transfer' : 'Plan a transfer' : step === 'review' ? 'Review transfer' : 'Transfer Submitted'}</DialogTitle></div>
          <DialogDescription>{step === 'summary' ? 'Your transfer has been debited and is pending administrator approval.' : 'Transfers require administrator approval before processing.'}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border pb-4 text-xs text-muted-foreground" aria-label="Transfer progress">
          <span className={step === 'details' ? 'text-primary font-semibold' : ''}>1 · Details</span><ArrowUpRight className="size-3" />
          <span className={step === 'review' ? 'text-primary font-semibold' : ''}>2 · Review</span><ArrowUpRight className="size-3" />
          <span className={step === 'summary' ? 'text-primary font-semibold' : ''}>3 · Summary</span>
        </div>
        {step === 'details' ? <form onSubmit={review} className="space-y-5">
          <label className="block text-sm font-medium" htmlFor="transfer-recipient">Recipient full name<Input id="transfer-recipient" className="mt-2 h-12" required maxLength={100} value={recipient} onChange={event => setRecipient(event.target.value)} /></label>
          {international && <fieldset className="space-y-4 border-y border-border py-4">
            <legend className="text-sm font-semibold">Recipient bank details</legend>
            <label className="block text-sm font-medium" htmlFor="wire-bank">Bank name<Input id="wire-bank" className="mt-2 h-12" required maxLength={120} placeholder="e.g., Barclays Bank PLC" value={bank} onChange={event => setBank(event.target.value)} /></label>
            <label className="block text-sm font-medium" htmlFor="wire-address">Recipient bank address (Street, City, Postal, Country)<Input id="wire-address" className="mt-2 h-12" required minLength={5} maxLength={240} placeholder="e.g., 1 Churchill Place, London E14 5HP, UK" value={bankAddress} onChange={event => setBankAddress(event.target.value)} autoComplete="off" /></label>
            <label className="block text-sm font-medium" htmlFor="wire-country">Bank country<Input id="wire-country" className="mt-2 h-12" required maxLength={80} placeholder="e.g., United Kingdom" value={country} onChange={event => setCountry(event.target.value)} /></label>
            <label className="block text-sm font-medium" htmlFor="wire-account">IBAN or account number<Input id="wire-account" className="mt-2 h-12" required maxLength={64} placeholder="e.g., GB29 NWBK 6016 1331 9268 19" value={account} onChange={event => setAccount(event.target.value)} /></label>
            <label className="block text-sm font-medium" htmlFor="wire-swift">SWIFT / BIC<Input id="wire-swift" className="mt-2 h-12" required maxLength={11} placeholder="e.g., BARCGB22" value={swift} onChange={event => setSwift(event.target.value.toUpperCase())} /></label>
            <p className="text-xs text-muted-foreground">International transfers require complete recipient bank address and SWIFT/BIC code.</p>
          </fieldset>}
          {domestic && <fieldset className="space-y-4 border-y border-border py-4">
            <legend className="text-sm font-semibold">Recipient bank details</legend>
            <label className="block text-sm font-medium" htmlFor="dom-bank">Bank name<Input id="dom-bank" className="mt-2 h-12" required maxLength={120} value={bank} onChange={event => setBank(event.target.value)} /></label>
            <label className="block text-sm font-medium" htmlFor="dom-routing">Routing number<Input id="dom-routing" className="mt-2 h-12" required inputMode="numeric" maxLength={9} value={swift} onChange={event => setSwift(event.target.value.replace(/\D/g, ''))} /></label>
            <label className="block text-sm font-medium" htmlFor="dom-account">Account number<Input id="dom-account" className="mt-2 h-12" required inputMode="numeric" maxLength={17} value={account} onChange={event => setAccount(event.target.value.replace(/\D/g, ''))} /></label>
            <p className="text-xs text-muted-foreground">Routing numbers have 9 digits. Bank details are not verified in this preview.</p>
          </fieldset>}
          <label className="block text-sm font-medium" htmlFor="transfer-amount">Transfer amount (USD)<Input id="transfer-amount" className="mt-2 h-12" required inputMode="decimal" placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)} aria-describedby="transfer-amount-help" aria-invalid={Boolean(amount && (!preview.valid || !preview.withinLimit))} /></label>
          <p id="transfer-amount-help" className="text-xs text-muted-foreground">You can send up to $5,000,000 a day. Terms and conditions apply.</p>
          {amount && !preview.valid && <p role="alert" className="text-sm text-destructive">Enter an amount greater than zero with up to two decimal places.</p>}
          {preview.valid && !preview.withinLimit && <p role="alert" className="text-sm text-destructive">The amount exceeds the $5,000,000 daily limit. Terms and conditions apply.</p>}
          <label className="block text-sm font-medium" htmlFor="transfer-reference">Reference or note<Input id="transfer-reference" className="mt-2 h-12" maxLength={140} placeholder="e.g., Invoice #1029 or gift" value={reference} onChange={event => setReference(event.target.value)} /></label>
          <BalanceImpact availableBalance={availableBalance} amount={amount} />
          <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" className="h-12" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="h-12" disabled={!isFormValid}>Review transfer<ArrowUpRight /></Button></div>
        </form> : <>
          {step === 'summary' && (
            <div role="status" className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/15 via-background to-primary/5 p-5 shadow-lg shadow-primary/10">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 text-slate-950 shadow-md ring-4 ring-primary/20">
                  <ThumbsUp className="size-7 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Transfer Submitted Successfully</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-500">
                      Pending Approval
                    </span>
                    <span className="text-xs text-muted-foreground">· Funds debited</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-snug">
                    Your account has been debited. The funds are placed on hold until an administrator reviews and approves the transaction.
                  </p>
                </div>
              </div>
            </div>
          )}

          <dl className="space-y-3.5 border-b border-border py-4 text-sm">
            <div className="flex justify-between gap-5"><dt className="text-muted-foreground">Status</dt><dd className="font-semibold text-amber-500">Pending Administrator Approval</dd></div>
            <div className="flex justify-between gap-5"><dt className="text-muted-foreground">Recipient</dt><dd className="max-w-[65%] break-words text-right font-medium" data-no-translate>{recipient.trim()}</dd></div>
            <div className="flex justify-between gap-5"><dt className="text-muted-foreground">Transfer amount</dt><dd className="font-semibold">{money(preview.amount)}</dd></div>
            {domestic && [['Bank name', bank], ['Routing number', swift], ['Account number', account]].map(([label, value]) => <div key={label} className="flex justify-between gap-5"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[60%] break-all text-right" data-no-translate>{value}</dd></div>)}
            {international && [['Bank name', bank], ['Recipient bank address', bankAddress], ['Bank country', country], ['IBAN or account number', account], ['SWIFT / BIC', swift]].map(([label, value]) => <div key={label} className="flex justify-between gap-5"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[60%] break-all text-right font-medium" data-no-translate>{value}</dd></div>)}
            {reference.trim() && <div className="flex justify-between gap-5"><dt className="text-muted-foreground">Reference or note</dt><dd className="max-w-[65%] break-words text-right" data-no-translate>{reference.trim()}</dd></div>}
            <div className="flex justify-between gap-5"><dt className="text-muted-foreground">Balance impact</dt><dd className="text-right text-xs text-muted-foreground">Debited immediately upon submission</dd></div>
          </dl>

          <BalanceImpact availableBalance={availableBalance} amount={amount} />
          {requestId && <p className="text-xs text-muted-foreground">Transaction Request ID: <span className="font-mono font-semibold" data-no-translate>{requestId.slice(0, 8).toUpperCase()}</span></p>}
          {step === 'review' && !preview.sufficient && <p className="text-sm text-destructive">Insufficient funds. Your available balance is less than this transfer.</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Info className="size-4 shrink-0 text-primary" />All outgoing transfers are immediately debited from your available balance and sent to administrator review for compliance clearance.</p>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button variant="outline" className="h-12" onClick={() => step === 'review' ? setStep('details') : setOpen(false)}>{step === 'review' ? <><ArrowLeft />Edit details</> : 'Done'}</Button>
            {step === 'review' ? <Button className="h-12" disabled={!preview.sufficient || submit.isPending} onClick={() => submit.mutate()}>{submit.isPending ? 'Submitting…' : 'Submit transfer'}<ArrowUpRight /></Button> : <Button className="h-12" onClick={download}><Download />Download receipt</Button>}
          </div>
        </>}
      </DialogContent>
    </Dialog>
  </></Localized>;
}

function BalanceImpact({ availableBalance, amount }: { availableBalance: number; amount: string }) {
  const result = transferPreview(availableBalance, amount);
  return <Localized><div className="border-y border-border py-4" aria-live="polite">
    <div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Wallet className="size-4" />Available balance</span><span className="font-medium">{money(availableBalance)}</span></div>
    <div className="mt-3 flex items-center justify-between gap-4"><span className="text-sm font-medium">{result.sufficient ? 'Available balance after transfer' : 'Balance unchanged'}</span><span className="shrink-0 text-xl font-bold text-primary">{money(result.remainingBalance)}</span></div>
    {result.valid && result.withinLimit && !result.sufficient && <p className="mt-3 text-sm text-destructive">Insufficient funds. No money will be sent.</p>}
    {result.shortfall > 0 && <div className="mt-2 flex justify-between gap-3 text-xs text-destructive"><span>Additional funds needed</span><span>{money(result.shortfall)}</span></div>}
    {result.sufficient && <p className="mt-3 text-xs text-muted-foreground">The transfer amount will be debited immediately and placed in pending state until admin verification.</p>}
  </div></Localized>;
}
