export type SalaryBand = { from: number; to: number; count: number };

/**
 * Percentile of an ascending list using linear interpolation between the closest ranks, so the
 * median of an even-sized list is the mean of the two middle values. Rounded to whole minor units.
 */
export function percentile(sorted: readonly number[], fraction: number): number | null {
  if (sorted.length === 0) return null;
  const rank = (sorted.length - 1) * fraction;
  const lowerIndex = Math.floor(rank);
  const lower = sorted[lowerIndex] ?? 0;
  const upper = sorted[Math.min(lowerIndex + 1, sorted.length - 1)] ?? lower;
  return Math.round(lower + (rank - lowerIndex) * (upper - lower));
}

export function median(sorted: readonly number[]): number | null {
  return percentile(sorted, 0.5);
}

/**
 * Splits an ascending list into equal-width bands between its min and max. Each band includes its
 * lower bound; the last band also includes the max.
 */
export function salaryBands(sorted: readonly number[], bandCount: number): SalaryBand[] {
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === undefined || max === undefined) return [];
  if (min === max) return [{ from: min, to: max, count: sorted.length }];

  const width = (max - min) / bandCount;
  const bands = Array.from({ length: bandCount }, (_, index) => ({
    from: Math.round(min + index * width),
    to: index === bandCount - 1 ? max : Math.round(min + (index + 1) * width),
    count: 0,
  }));
  for (const value of sorted) {
    const index = Math.min(Math.floor((value - min) / width), bandCount - 1);
    const band = bands[index];
    if (band) band.count += 1;
  }
  return bands;
}
