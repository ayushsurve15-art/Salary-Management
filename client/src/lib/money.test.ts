import { describe, expect, it } from 'vitest';
import { formatMoney, fractionDigits, fromMinorUnits, toMinorUnits } from './money';

describe('fractionDigits', () => {
  it('knows that yen has no minor unit', () => {
    expect(fractionDigits('USD')).toBe(2);
    expect(fractionDigits('JPY')).toBe(0);
  });
});

describe('formatMoney', () => {
  it('formats minor units in the given currency', () => {
    expect(formatMoney(6_500_050, 'USD', 'en-US')).toBe('$65,000.50');
    expect(formatMoney(6_500_000, 'EUR', 'en-US')).toBe('€65,000');
  });

  it('does not divide yen by 100', () => {
    expect(formatMoney(7_000_000, 'JPY', 'en-US')).toBe('¥7,000,000');
  });
});

describe('toMinorUnits', () => {
  it.each([
    ['65000', 'USD', 6_500_000],
    ['65,000.5', 'USD', 6_500_050],
    [' 65 000.05 ', 'EUR', 6_500_005],
    ['7000000', 'JPY', 7_000_000],
  ])('parses "%s" %s as %i', (input, currency, expected) => {
    expect(toMinorUnits(input, currency)).toBe(expected);
  });

  it('avoids floating point error on amounts like 0.29', () => {
    expect(toMinorUnits('0.29', 'USD')).toBe(29);
  });

  it.each([
    ['too many decimals', '10.555', 'USD'],
    ['decimals on yen', '100.5', 'JPY'],
    ['a negative amount', '-5', 'USD'],
    ['letters', '12abc', 'USD'],
    ['nothing', '', 'USD'],
  ])('rejects %s', (_label, input, currency) => {
    expect(toMinorUnits(input, currency)).toBeNull();
  });
});

describe('fromMinorUnits', () => {
  it('round-trips with toMinorUnits', () => {
    expect(fromMinorUnits(6_500_000, 'USD')).toBe('65000');
    expect(fromMinorUnits(6_500_050, 'USD')).toBe('65000.50');
    expect(fromMinorUnits(7_000_000, 'JPY')).toBe('7000000');
  });
});
