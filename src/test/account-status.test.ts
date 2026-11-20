import { describe, expect, it } from 'vitest';
import { accountStatusSchema } from '@/lib/account-status';

describe('Saved account status', () => {
  it.each(['Active', 'Verified', 'Review needed', 'Temporarily restricted', 'Closed'])('preserves %s exactly for customer display', status => {
    expect(accountStatusSchema.parse(status)).toBe(status);
  });
  it('rejects unknown status values', () => {
    expect(accountStatusSchema.safeParse('made-up').success).toBe(false);
  });
});