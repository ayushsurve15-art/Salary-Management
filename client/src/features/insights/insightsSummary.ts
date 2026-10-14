import type { CountryStats } from '../../api/types';

export type CurrencyHeadcount = { currency: string; headcount: number; countries: string[] };

/** Headcount per currency, largest first. Counting people across currencies is safe; money is not. */
export function headcountByCurrency(countries: CountryStats[]): CurrencyHeadcount[] {
  const byCurrency = new Map<string, CurrencyHeadcount>();
  for (const country of countries) {
    const entry = byCurrency.get(country.currency) ?? {
      currency: country.currency,
      headcount: 0,
      countries: [],
    };
    entry.headcount += country.headcount;
    entry.countries.push(country.countryName);
    byCurrency.set(country.currency, entry);
  }
  return [...byCurrency.values()].sort(
    (a, b) => b.headcount - a.headcount || a.currency.localeCompare(b.currency),
  );
}

/** The currency in the URL if it has data, otherwise the one most people are paid in. */
export function pickCurrency(requested: string | null, available: CurrencyHeadcount[]): string {
  const match = available.find((entry) => entry.currency === requested);
  return match?.currency ?? available[0]?.currency ?? '';
}
