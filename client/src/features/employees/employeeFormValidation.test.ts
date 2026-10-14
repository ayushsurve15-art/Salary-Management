import { describe, expect, it } from 'vitest';
import type { Country } from '../../api/types';
import {
  EMPTY_EMPLOYEE_FORM,
  MAX_SALARY_MINOR,
  toCreateInput,
  toSalaryChangeInput,
  validateEmployeeForm,
  validateSalaryChange,
  type EmployeeFormValues,
} from './employeeFormValidation';

const countries: Country[] = [
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'JP', name: 'Japan', currency: 'JPY' },
];
const TODAY = '2025-06-15';
const createOptions = { mode: 'create' as const, countries, today: TODAY };

const validForm: EmployeeFormValues = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  jobTitle: 'Engineer',
  department: 'Engineering',
  country: 'GB',
  salary: '65000',
  hireDate: '2020-01-06',
};

describe('validateEmployeeForm', () => {
  it('accepts a complete, valid form', () => {
    expect(validateEmployeeForm(validForm, createOptions)).toEqual({});
  });

  it('reports every missing field on an empty form', () => {
    expect(Object.keys(validateEmployeeForm(EMPTY_EMPLOYEE_FORM, createOptions)).sort()).toEqual([
      'country',
      'department',
      'email',
      'firstName',
      'hireDate',
      'jobTitle',
      'lastName',
      'salary',
    ]);
  });

  it('treats whitespace-only names as empty, like the API', () => {
    expect(validateEmployeeForm({ ...validForm, firstName: '   ' }, createOptions)).toEqual({
      firstName: 'Must not be empty',
    });
  });

  it.each([
    ['zero', '0', 'Must be greater than zero'],
    ['negative', '-1', 'Must be a plain amount, like 65000 or 65000.50'],
    ['too precise', '1.234', 'Must be a plain amount, like 65000 or 65000.50'],
    ['huge', String(MAX_SALARY_MINOR), 'Is unrealistically large'],
  ])('rejects a %s salary', (_label, salary, message) => {
    expect(validateEmployeeForm({ ...validForm, salary }, createOptions).salary).toBe(message);
  });

  it('rejects an invalid email and a future or impossible hire date', () => {
    expect(validateEmployeeForm({ ...validForm, email: 'ada@' }, createOptions).email).toBe(
      'Must be a valid email',
    );
    expect(
      validateEmployeeForm({ ...validForm, hireDate: '2025-06-16' }, createOptions).hireDate,
    ).toBe('Must not be in the future');
    expect(
      validateEmployeeForm({ ...validForm, hireDate: '2023-02-30' }, createOptions).hireDate,
    ).toBe('Must be a valid date');
  });

  it('skips country and salary when editing, since neither can be changed there', () => {
    const errors = validateEmployeeForm(
      { ...validForm, country: '', salary: '' },
      { ...createOptions, mode: 'edit' },
    );

    expect(errors).toEqual({});
  });
});

describe('toCreateInput', () => {
  it('trims text, lower-cases the email and converts the salary to minor units', () => {
    const input = toCreateInput(
      { ...validForm, firstName: ' Ada ', email: ' Ada@Example.com ', salary: '65,000.50' },
      'GBP',
    );

    expect(input).toMatchObject({
      firstName: 'Ada',
      email: 'ada@example.com',
      currency: 'GBP',
      salaryMinor: 6_500_050,
    });
  });
});

describe('validateSalaryChange', () => {
  const options = { currency: 'GBP', hireDate: '2020-01-06', today: TODAY };
  const valid = { amount: '70000', effectiveDate: '2024-04-01', reason: 'Promotion' };

  it('accepts a valid change', () => {
    expect(validateSalaryChange(valid, options)).toEqual({});
  });

  it('rejects an effective date before the hire date or in the future', () => {
    expect(
      validateSalaryChange({ ...valid, effectiveDate: '2019-12-31' }, options).effectiveDate,
    ).toBe('Must not be before the hire date (2020-01-06)');
    expect(
      validateSalaryChange({ ...valid, effectiveDate: '2025-06-16' }, options).effectiveDate,
    ).toBe('Must not be in the future');
  });

  it('requires a reason', () => {
    expect(validateSalaryChange({ ...valid, reason: ' ' }, options)).toEqual({
      reason: 'Must not be empty',
    });
  });
});

describe('toSalaryChangeInput', () => {
  it('sends the employee currency and version with the amount in minor units', () => {
    const input = toSalaryChangeInput(
      { amount: '7000000', effectiveDate: '2024-04-01', reason: ' Promotion ' },
      { currency: 'JPY', version: 3 },
    );

    expect(input).toEqual({
      salaryMinor: 7_000_000,
      currency: 'JPY',
      effectiveDate: '2024-04-01',
      reason: 'Promotion',
      version: 3,
    });
  });
});
