import { describe, expect, it } from 'vitest';
import { median, percentile, salaryBands } from './statistics.js';

describe('median', () => {
  it('is null for an empty group', () => {
    expect(median([])).toBeNull();
  });

  it('is the only value for a single-row group', () => {
    expect(median([4200])).toBe(4200);
  });

  it('is the middle value for an odd count', () => {
    expect(median([100, 300, 900])).toBe(300);
  });

  it('is the mean of the two middle values for an even count', () => {
    expect(median([100, 200, 400, 1000])).toBe(300);
  });

  it('rounds a half-unit result to whole minor units', () => {
    expect(median([100, 101])).toBe(101);
  });
});

describe('percentile', () => {
  const salaries = [10, 20, 30, 40, 50];

  it('returns the min and max at the extremes', () => {
    expect(percentile(salaries, 0)).toBe(10);
    expect(percentile(salaries, 1)).toBe(50);
  });

  it('interpolates between neighbouring ranks', () => {
    expect(percentile([10, 20, 30, 40], 0.25)).toBe(18);
    expect(percentile(salaries, 0.75)).toBe(40);
  });

  it('is null for an empty group', () => {
    expect(percentile([], 0.25)).toBeNull();
  });
});

describe('salaryBands', () => {
  it('returns no bands for an empty group', () => {
    expect(salaryBands([], 5)).toEqual([]);
  });

  it('returns one band when every salary is the same', () => {
    expect(salaryBands([500, 500, 500], 5)).toEqual([{ from: 500, to: 500, count: 3 }]);
  });

  it('splits the range into equal-width bands and counts each salary once', () => {
    const bands = salaryBands([0, 10, 24, 25, 49, 50, 99, 100], 4);

    expect(bands).toEqual([
      { from: 0, to: 25, count: 3 },
      { from: 25, to: 50, count: 2 },
      { from: 50, to: 75, count: 1 },
      { from: 75, to: 100, count: 2 },
    ]);
  });

  it('puts the maximum salary in the last band', () => {
    const bands = salaryBands([1, 2, 3], 2);

    expect(bands.at(-1)).toEqual({ from: 2, to: 3, count: 2 });
    expect(bands.reduce((sum, band) => sum + band.count, 0)).toBe(3);
  });
});
