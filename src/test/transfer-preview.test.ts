import { describe, expect, it } from 'vitest';
import { transferPreview } from '@/lib/transfer-preview';

describe('Transfer balance preview', () => {
  it('shows the new available balance after the proposed transfer', () => {
    expect(transferPreview(100, '25.10').remainingBalance).toBe(74.90);
  });
  it('keeps a zero balance unchanged when there are insufficient funds', () => {
    const result = transferPreview(0, '25');
    expect(result.sufficient).toBe(false);
    expect(result.remainingBalance).toBe(0);
    expect(result.shortfall).toBe(25);
  });
  it('accepts the confirmed $5,000,000 limit', () => {
    expect(transferPreview(5_000_000, '5000000').withinLimit).toBe(true);
  });
  it('rejects amounts above $5,000,000', () => {
    expect(transferPreview(6_000_000, '5000000.01').withinLimit).toBe(false);
  });
  it.each(['0', '-1', '1.001', 'abc', 'Infinity'])('rejects an invalid amount %s', value => {
    expect(transferPreview(100, value).valid).toBe(false);
  });
});