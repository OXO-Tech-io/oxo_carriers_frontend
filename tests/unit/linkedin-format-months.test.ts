import { describe, it, expect } from 'vitest';
import { formatMonths } from '@/lib/utils';

describe('formatMonths', () => {
  it('formats months and years', () => {
    expect(formatMonths(0)).toBe('0 mos');
    expect(formatMonths(1)).toBe('1 mo');
    expect(formatMonths(12)).toBe('1 yr');
    expect(formatMonths(26)).toBe('2 yrs 2 mos');
  });
});
