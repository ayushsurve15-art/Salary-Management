import { findCountry } from '../domain/countries.js';
import { median, percentile, salaryBands, type SalaryBand } from '../domain/statistics.js';
import type {
  EarnerRow,
  GroupAggregate,
  GroupDimension,
  GroupSalary,
  InsightsRepository,
} from '../repositories/insightsRepository.js';

export type GroupStats = {
  key: string;
  currency: string;
  headcount: number;
  min: number;
  max: number;
  average: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
};

export type CountryStats = GroupStats & { countryName: string };

export type Distribution = { currency: string; bands: SalaryBand[] };

export type Earners = { currency: string; top: EarnerRow[]; bottom: EarnerRow[] };

export type InsightsService = ReturnType<typeof createInsightsService>;

const groupKey = (key: string, currency: string) => `${key}\u0000${currency}`;

function groupSalaries(rows: GroupSalary[]): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const id = groupKey(row.key, row.currency);
    const salaries = groups.get(id);
    if (salaries) salaries.push(row.salary);
    else groups.set(id, [row.salary]);
  }
  return groups;
}

/** Joins SQL aggregates with percentiles taken from the same groups' sorted salaries. */
function combineStats(aggregates: GroupAggregate[], salaries: GroupSalary[]): GroupStats[] {
  const salariesByGroup = groupSalaries(salaries);
  return aggregates.map((aggregate) => {
    const sorted = salariesByGroup.get(groupKey(aggregate.key, aggregate.currency)) ?? [];
    return {
      ...aggregate,
      average: Math.round(aggregate.average),
      median: median(sorted),
      p25: percentile(sorted, 0.25),
      p75: percentile(sorted, 0.75),
    };
  });
}

export function createInsightsService(repository: InsightsRepository) {
  const statsBy = (dimension: GroupDimension, currency?: string) =>
    combineStats(
      repository.aggregates(dimension, currency),
      repository.sortedSalaries(dimension, currency),
    );

  return {
    byCountry(): CountryStats[] {
      return statsBy('country').map((stats) => ({
        ...stats,
        countryName: findCountry(stats.key)?.name ?? stats.key,
      }));
    },

    byGroup(dimension: Exclude<GroupDimension, 'country'>, currency: string): GroupStats[] {
      return statsBy(dimension, currency);
    },

    distribution(currency: string, bandCount: number): Distribution {
      return { currency, bands: salaryBands(repository.salariesForCurrency(currency), bandCount) };
    },

    earners(currency: string, limit: number): Earners {
      return {
        currency,
        top: repository.topEarners(currency, limit),
        bottom: repository.bottomEarners(currency, limit),
      };
    },
  };
}
