import { describe, expect, it } from 'vitest';
import { findCountry } from '../domain/countries.js';
import { createEmployeeSchema, MAX_SALARY_MINOR } from '../validation/employeeSchemas.js';
import { generateEmployees } from './generateEmployees.js';
import { createRandom } from './random.js';

const options = { count: 2_000, seed: 7, referenceDate: '2025-06-30' };

describe('createRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRandom(123);
    const b = createRandom(123);

    expect(Array.from({ length: 5 }, a.next)).toEqual(Array.from({ length: 5 }, b.next));
  });

  it('keeps integers within the inclusive range', () => {
    const random = createRandom(1);
    const values = Array.from({ length: 1_000 }, () => random.int(3, 5));

    expect(new Set(values)).toEqual(new Set([3, 4, 5]));
  });
});

describe('generateEmployees', () => {
  const employees = generateEmployees(options);

  it('generates exactly the requested number of employees', () => {
    expect(employees).toHaveLength(2_000);
  });

  it('is deterministic for a given seed', () => {
    expect(generateEmployees(options)).toEqual(employees);
  });

  it('produces different data for a different seed', () => {
    expect(generateEmployees({ ...options, seed: 8 })).not.toEqual(employees);
  });

  it('gives every employee a unique email, ignoring case', () => {
    const emails = new Set(employees.map((employee) => employee.email.toLowerCase()));

    expect(emails.size).toBe(employees.length);
  });

  it('produces employees the API itself would accept', () => {
    for (const { history, ...employee } of employees) {
      expect(createEmployeeSchema.safeParse(employee).success).toBe(true);
      expect(findCountry(employee.country)?.currency).toBe(employee.currency);
      expect(employee.salaryMinor).toBeLessThanOrEqual(MAX_SALARY_MINOR);
    }
  });

  it('covers every supported country with a plausible spread', () => {
    const countries = new Set(employees.map((employee) => employee.country));

    expect(countries.size).toBe(10);
  });

  it('builds salary history that starts at hire and ends at the current salary', () => {
    for (const employee of employees) {
      const dates = employee.history.map((entry) => entry.effectiveDate);

      expect(employee.history[0]).toMatchObject({
        effectiveDate: employee.hireDate,
        reason: 'Initial salary',
      });
      expect(employee.history.at(-1)?.salaryMinor).toBe(employee.salaryMinor);
      expect(dates).toEqual([...dates].sort());
      expect(dates.every((date) => date <= options.referenceDate)).toBe(true);
    }
  });
});
