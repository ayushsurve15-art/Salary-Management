import { describe, expect, it } from 'vitest';
import type { CountryStats } from '../../api/types';
import { headcountByCurrency, pickCurrency } from './insightsSummary';

function country(key: string, countryName: string, currency: string, headcount: number) {
  const stats: CountryStats = {
    key,
    countryName,
    currency,
    headcount,
    min: 1,
    max: 1,
    average: 1,
    median: 1,
    p25: 1,
    p75: 1,
  };
  return stats;
}

const countries = [
  country('DE', 'Germany', 'EUR', 10),
  country('FR', 'France', 'EUR', 5),
  country('US', 'United States', 'USD', 12),
  country('JP', 'Japan', 'JPY', 3),
];

describe('headcountByCurrency', () => {
  it('adds up people per currency, largest first', () => {
    expect(headcountByCurrency(countries)).toEqual([
      { currency: 'EUR', headcount: 15, countries: ['Germany', 'France'] },
      { currency: 'USD', headcount: 12, countries: ['United States'] },
      { currency: 'JPY', headcount: 3, countries: ['Japan'] },
    ]);
  });

  it('returns nothing for an empty organisation', () => {
    expect(headcountByCurrency([])).toEqual([]);
  });
});

describe('pickCurrency', () => {
  const available = headcountByCurrency(countries);

  it('keeps a requested currency that has employees', () => {
    expect(pickCurrency('JPY', available)).toBe('JPY');
  });

  it('falls back to the largest currency for a missing or unknown one', () => {
    expect(pickCurrency(null, available)).toBe('EUR');
    expect(pickCurrency('XYZ', available)).toBe('EUR');
  });

  it('returns an empty string when there is no data', () => {
    expect(pickCurrency('EUR', [])).toBe('');
  });
});
