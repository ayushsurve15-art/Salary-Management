import type { Db } from '../db/connection.js';

export type GroupDimension = 'country' | 'department' | 'jobTitle';

export type GroupAggregate = {
  key: string;
  currency: string;
  headcount: number;
  min: number;
  max: number;
  average: number;
};

export type GroupSalary = { key: string; currency: string; salary: number };

export type EarnerRow = {
  id: number;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salaryMinor: number;
};

// Whitelisted so the dimension can be interpolated into SQL safely.
const DIMENSION_COLUMNS: Record<GroupDimension, string> = {
  country: 'country',
  department: 'department',
  jobTitle: 'job_title',
};

const EARNER_COLUMNS = `id, first_name AS firstName, last_name AS lastName, job_title AS jobTitle,
  department, country, currency, salary_minor AS salaryMinor`;

export type InsightsRepository = ReturnType<typeof createInsightsRepository>;

export function createInsightsRepository(db: Db) {
  const salariesForCurrency = db.prepare<[string], { salary: number }>(
    'SELECT salary_minor AS salary FROM employees WHERE currency = ? ORDER BY salary_minor',
  );
  const topEarners = db.prepare<[string, number], EarnerRow>(
    `SELECT ${EARNER_COLUMNS} FROM employees WHERE currency = ?
     ORDER BY salary_minor DESC, id ASC LIMIT ?`,
  );
  const bottomEarners = db.prepare<[string, number], EarnerRow>(
    `SELECT ${EARNER_COLUMNS} FROM employees WHERE currency = ?
     ORDER BY salary_minor ASC, id ASC LIMIT ?`,
  );

  function currencyFilter(currency: string | undefined) {
    return currency === undefined
      ? { where: '', params: [] }
      : { where: 'WHERE currency = ?', params: [currency] };
  }

  return {
    /** Count, min, max and average per group and currency, ordered by group then currency. */
    aggregates(dimension: GroupDimension, currency?: string): GroupAggregate[] {
      const column = DIMENSION_COLUMNS[dimension];
      const { where, params } = currencyFilter(currency);
      return db
        .prepare<string[], GroupAggregate>(
          `SELECT ${column} AS key, currency, COUNT(*) AS headcount, MIN(salary_minor) AS min,
             MAX(salary_minor) AS max, AVG(salary_minor) AS average
           FROM employees ${where}
           GROUP BY ${column}, currency
           ORDER BY ${column}, currency`,
        )
        .all(...params);
    },

    /** Every salary, ordered by group, currency and amount, for percentile calculations. */
    sortedSalaries(dimension: GroupDimension, currency?: string): GroupSalary[] {
      const column = DIMENSION_COLUMNS[dimension];
      const { where, params } = currencyFilter(currency);
      return db
        .prepare<string[], GroupSalary>(
          `SELECT ${column} AS key, currency, salary_minor AS salary
           FROM employees ${where}
           ORDER BY ${column}, currency, salary_minor`,
        )
        .all(...params);
    },

    salariesForCurrency: (currency: string): number[] =>
      salariesForCurrency.all(currency).map((row) => row.salary),

    topEarners: (currency: string, limit: number): EarnerRow[] => topEarners.all(currency, limit),

    bottomEarners: (currency: string, limit: number): EarnerRow[] =>
      bottomEarners.all(currency, limit),
  };
}
