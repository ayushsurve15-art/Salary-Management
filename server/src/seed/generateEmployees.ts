import { findCountry } from '../domain/countries.js';
import { INITIAL_SALARY_REASON, type NewEmployee } from '../domain/employee.js';
import { createRandom, type Random } from './random.js';
import {
  COUNTRY_PROFILES,
  DEPARTMENTS,
  FIRST_NAMES,
  LAST_NAMES,
  RAISE_REASONS,
} from './referenceData.js';

export type SeedSalaryEntry = { salaryMinor: number; effectiveDate: string; reason: string };

export type SeedEmployee = NewEmployee & { history: SeedSalaryEntry[] };

export type GenerateOptions = { count: number; seed: number; referenceDate: string };

const DAY_MS = 86_400_000;
const EARLIEST_HIRE = Date.UTC(2012, 0, 1);
const MAX_RAISES = 4;

const countryChoices = COUNTRY_PROFILES.map((profile) => ({
  value: profile,
  weight: profile.weight,
}));
const departmentChoices = DEPARTMENTS.map((department) => ({
  value: department,
  weight: department.weight,
}));

function toDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

// Minor units per major unit: 100 for most currencies, 1 for yen.
const minorUnitFactors = new Map(
  COUNTRY_PROFILES.map(({ country }) => {
    const currency = findCountry(country)?.currency ?? 'USD';
    const { maximumFractionDigits } = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions();
    return [currency, 10 ** (maximumFractionDigits ?? 2)];
  }),
);

function minorUnitFactor(currency: string): number {
  return minorUnitFactors.get(currency) ?? 100;
}

/** Salaries are rounded to 100 major units, the way offers are usually written. */
function roundedSalary(majorUnits: number, factor: number): number {
  return Math.max(100, Math.round(majorUnits / 100) * 100) * factor;
}

function uniqueEmail(first: string, last: string, taken: Set<string>): string {
  const local = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '');
  let candidate = `${local}@example.com`;
  for (let suffix = 2; taken.has(candidate); suffix += 1) {
    candidate = `${local}${suffix}@example.com`;
  }
  taken.add(candidate);
  return candidate;
}

/** Hire salary first, then a few raises on later anniversaries, ending at the current salary. */
function salaryHistory(
  random: Random,
  hireMs: number,
  referenceMs: number,
  targetMajor: number,
  factor: number,
): SeedSalaryEntry[] {
  const fullYears = Math.floor((referenceMs - hireMs) / (365 * DAY_MS));
  const raiseCount = random.int(0, Math.min(fullYears, MAX_RAISES));
  const raiseFactors = Array.from({ length: raiseCount }, () => random.between(1.03, 1.12));

  let major = raiseFactors.reduce((amount, raise) => amount / raise, targetMajor);
  const history: SeedSalaryEntry[] = [
    {
      salaryMinor: roundedSalary(major, factor),
      effectiveDate: toDate(hireMs),
      reason: INITIAL_SALARY_REASON,
    },
  ];

  const firstRaiseYear = fullYears - raiseCount + 1;
  raiseFactors.forEach((raise, index) => {
    major *= raise;
    const anniversary = new Date(hireMs);
    anniversary.setUTCFullYear(anniversary.getUTCFullYear() + firstRaiseYear + index);
    history.push({
      salaryMinor: roundedSalary(major, factor),
      effectiveDate: toDate(Math.min(anniversary.getTime(), referenceMs)),
      reason: random.weighted(RAISE_REASONS),
    });
  });
  return history;
}

function generateEmployee(random: Random, referenceMs: number, emails: Set<string>): SeedEmployee {
  const profile = random.weighted(countryChoices);
  const currency = findCountry(profile.country)?.currency;
  if (currency === undefined) throw new Error(`No currency for ${profile.country}`);
  const department = random.weighted(departmentChoices);
  const role = random.weighted(department.roles.map((r) => ({ value: r, weight: r.weight })));
  const firstName = random.pick(FIRST_NAMES);
  const lastName = random.pick(LAST_NAMES);

  const hireMs = EARLIEST_HIRE + random.int(0, (referenceMs - EARLIEST_HIRE) / DAY_MS) * DAY_MS;
  const targetMajor = profile.baseSalary * role.multiplier * random.between(0.8, 1.2);
  const history = salaryHistory(
    random,
    hireMs,
    referenceMs,
    targetMajor,
    minorUnitFactor(currency),
  );
  const current = history.at(-1);
  if (current === undefined) throw new Error('Salary history cannot be empty');

  return {
    firstName,
    lastName,
    email: uniqueEmail(firstName, lastName, emails),
    jobTitle: role.title,
    department: department.name,
    country: profile.country,
    currency,
    salaryMinor: current.salaryMinor,
    hireDate: toDate(hireMs),
    history,
  };
}

/** Pure and deterministic: the same options always produce the same employees. */
export function generateEmployees({ count, seed, referenceDate }: GenerateOptions): SeedEmployee[] {
  const random = createRandom(seed);
  const referenceMs = Date.parse(`${referenceDate}T00:00:00Z`);
  const emails = new Set<string>();
  return Array.from({ length: count }, () => generateEmployee(random, referenceMs, emails));
}
