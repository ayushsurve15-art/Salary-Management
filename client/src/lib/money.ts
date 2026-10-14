const digitsCache = new Map<string, number>();

/** Number of minor-unit digits for a currency: 2 for USD and EUR, 0 for JPY. */
export function fractionDigits(currency: string): number {
  let digits = digitsCache.get(currency);
  if (digits === undefined) {
    digits =
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    digitsCache.set(currency, digits);
  }
  return digits;
}

/** Formats integer minor units in their own currency, dropping `.00` from whole amounts. */
export function formatMoney(minor: number, currency: string, locale?: string): string {
  const digits = fractionDigits(currency);
  const factor = 10 ** digits;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: minor % factor === 0 ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(minor / factor);
}

/**
 * Parses a user-typed amount such as "65,000.50" into integer minor units without going through
 * floating point. Returns null for anything that is not a plain non-negative amount.
 */
export function toMinorUnits(input: string, currency: string): number | null {
  const digits = fractionDigits(currency);
  const match = /^(\d+)(?:\.(\d+))?$/.exec(input.trim().replace(/[,\s]/g, ''));
  if (!match) return null;
  const [, whole = '', fraction = ''] = match;
  if (fraction.length > digits) return null;
  return Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0') || '0');
}
