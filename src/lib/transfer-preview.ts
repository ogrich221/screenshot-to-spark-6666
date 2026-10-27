export const DAILY_TRANSFER_LIMIT = 5_000_000;

/** Preview only: never mutates account balances or submits a payment. */
export function transferPreview(availableBalance: number, amountText: string) {
  const valid = /^\d+(\.\d{1,2})?$/.test(amountText);
  const amount = valid ? Number(amountText) : NaN;
  const availableCents = Math.round(availableBalance * 100);
  const amountCents = Math.round(amount * 100);
  const positive = Number.isFinite(amountCents) && amountCents > 0;
  const withinLimit = positive && amountCents <= DAILY_TRANSFER_LIMIT * 100;
  const sufficient = withinLimit && amountCents <= availableCents;
  return {
    valid: positive,
    withinLimit,
    sufficient,
    amount: positive ? amountCents / 100 : 0,
    remainingBalance: sufficient ? (availableCents - amountCents) / 100 : availableBalance,
    shortfall: withinLimit ? Math.max(0, amountCents - availableCents) / 100 : 0,
  };
}