import { describe, expect, it } from 'vitest';
import { catalogues, translate } from '@/lib/translate';
describe('Language requirements', () => {
  it.each(['fr', 'es', 'de', 'pt'] as const)('preserves the $5,000,000 transfer limit in %s', lang => {
    expect(translate('You can send up to $5,000,000 a day. Terms and conditions apply.', lang)).toContain('$5,000,000');
  });
  it.each(['fr', 'es', 'de', 'pt'] as const)('does not translate an entered email address in %s', lang => {
    expect(translate('customer@example.org', lang)).toBe('customer@example.org');
  });
  it('has matching source keys for all four translated languages', () => {
    const keys = Object.keys(catalogues.fr).sort();
    for (const lang of ['es', 'de', 'pt'] as const) expect(Object.keys(catalogues[lang]).sort()).toEqual(keys);
  });
});