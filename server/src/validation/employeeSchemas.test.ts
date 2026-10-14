import { describe, expect, it } from 'vitest';
import { employeeInput } from '../testing/testApp.js';
import {
  createEmployeeSchema,
  employeeIdSchema,
  listEmployeesQuerySchema,
  MAX_PAGE_SIZE,
  MAX_SALARY_MINOR,
  salaryChangeSchema,
} from './employeeSchemas.js';

function errorsFor(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
}

describe('createEmployeeSchema', () => {
  it('trims text fields and lower-cases the email', () => {
    const parsed = createEmployeeSchema.parse(
      employeeInput({ firstName: '  Ada ', email: '  Ada@Example.COM ', country: 'gb' }),
    );

    expect(parsed).toMatchObject({ firstName: 'Ada', email: 'ada@example.com', country: 'GB' });
  });

  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['too long', 'x'.repeat(101)],
  ])('rejects a %s first name', (_label, firstName) => {
    const result = createEmployeeSchema.safeParse(employeeInput({ firstName }));

    expect(errorsFor(result)).toEqual(['firstName']);
  });

  it.each([
    ['zero', 0],
    ['negative', -100],
    ['fractional', 1234.5],
    ['absurdly large', MAX_SALARY_MINOR + 1],
    ['a numeric string', '5000'],
  ])('rejects a %s salary', (_label, salaryMinor) => {
    const result = createEmployeeSchema.safeParse(employeeInput({ salaryMinor }));

    expect(errorsFor(result)).toEqual(['salaryMinor']);
  });

  it('accepts the largest allowed salary', () => {
    expect(
      createEmployeeSchema.safeParse(employeeInput({ salaryMinor: MAX_SALARY_MINOR })).success,
    ).toBe(true);
  });

  it('rejects an unsupported currency and country', () => {
    const result = createEmployeeSchema.safeParse(
      employeeInput({ currency: 'XYZ', country: 'ZZ' }),
    );

    expect(errorsFor(result).sort()).toEqual(['country', 'currency']);
  });

  it('rejects an invalid email and an impossible date', () => {
    const result = createEmployeeSchema.safeParse(
      employeeInput({ email: 'not-an-email', hireDate: '2023-02-30' }),
    );

    expect(errorsFor(result).sort()).toEqual(['email', 'hireDate']);
  });

  it('rejects fields it does not know about', () => {
    const result = createEmployeeSchema.safeParse(employeeInput({ isAdmin: true }));

    expect(result.success).toBe(false);
  });
});

describe('salaryChangeSchema', () => {
  const change = {
    salaryMinor: 7_000_000,
    currency: 'GBP',
    effectiveDate: '2024-04-01',
    reason: 'Promotion',
    version: 1,
  };

  it('accepts a valid change', () => {
    expect(salaryChangeSchema.safeParse(change).success).toBe(true);
  });

  it('requires a non-blank reason and a version', () => {
    const result = salaryChangeSchema.safeParse({ ...change, reason: '  ', version: undefined });

    expect(errorsFor(result).sort()).toEqual(['reason', 'version']);
  });
});

describe('employeeIdSchema', () => {
  it('parses a positive integer id', () => {
    expect(employeeIdSchema.parse('42')).toBe(42);
  });

  it.each(['0', '-1', '1.5', 'abc', '1e3', '01', '99999999999999999'])('rejects "%s"', (id) => {
    expect(employeeIdSchema.safeParse(id).success).toBe(false);
  });
});

describe('listEmployeesQuerySchema', () => {
  it('applies defaults to an empty query', () => {
    expect(listEmployeesQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 25,
      sort: 'name',
      order: 'asc',
    });
  });

  it('caps the page size instead of rejecting it', () => {
    expect(listEmployeesQuerySchema.parse({ pageSize: '5000' }).pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('ignores a blank search', () => {
    expect(listEmployeesQuerySchema.parse({ search: '   ' }).search).toBeUndefined();
  });

  it('only allows whitelisted sort fields', () => {
    const result = listEmployeesQuerySchema.safeParse({
      sort: 'salary_minor; DROP TABLE employees',
    });

    expect(errorsFor(result)).toEqual(['sort']);
  });

  it('requires a currency for a salary range', () => {
    const result = listEmployeesQuerySchema.safeParse({ minSalary: '100' });

    expect(errorsFor(result)).toEqual(['currency']);
  });

  it('rejects a salary range where min is above max', () => {
    const result = listEmployeesQuerySchema.safeParse({
      currency: 'USD',
      minSalary: '500',
      maxSalary: '100',
    });

    expect(errorsFor(result)).toEqual(['minSalary']);
  });

  it('rejects a page below 1', () => {
    expect(errorsFor(listEmployeesQuerySchema.safeParse({ page: '0' }))).toEqual(['page']);
  });
});
