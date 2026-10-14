export type Country = { code: string; name: string; currency: string };

/** The countries the organisation employs people in. Each pays in exactly one currency. */
export const COUNTRIES: readonly Country[] = [
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'JP', name: 'Japan', currency: 'JPY' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'US', name: 'United States', currency: 'USD' },
];

const byCode = new Map(COUNTRIES.map((country) => [country.code, country]));

export const SUPPORTED_CURRENCIES: ReadonlySet<string> = new Set(
  COUNTRIES.map((country) => country.currency),
);

export function findCountry(code: string): Country | undefined {
  return byCode.get(code);
}
