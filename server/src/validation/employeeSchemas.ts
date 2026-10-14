import { z } from 'zod';
import { findCountry, SUPPORTED_CURRENCIES } from '../domain/countries.js';
import { SORT_FIELDS } from '../domain/employee.js';

export const MAX_SALARY_MINOR = 1_000_000_000_000;
export const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

const text = (max: number) => z.string().trim().min(1, 'Must not be empty').max(max);

const email = z.string().trim().toLowerCase().max(254).pipe(z.email('Must be a valid email'));

const isoDate = z.iso.date('Must be a date in YYYY-MM-DD format');

const country = z
  .string()
  .trim()
  .toUpperCase()
  .refine((code) => findCountry(code) !== undefined, 'Unsupported country');

const currency = z
  .string()
  .trim()
  .toUpperCase()
  .refine((code) => SUPPORTED_CURRENCIES.has(code), 'Unsupported currency');

const salaryMinor = z
  .number('Must be a number')
  .int('Must be a whole number of minor units')
  .positive('Must be greater than zero')
  .max(MAX_SALARY_MINOR, 'Is unrealistically large');

const version = z.number().int().positive();

export const employeeIdSchema = z
  .string()
  .regex(/^[1-9]\d{0,15}$/, 'Must be a positive integer id')
  .transform(Number);

const profileShape = {
  firstName: text(100),
  lastName: text(100),
  email,
  jobTitle: text(100),
  department: text(100),
  hireDate: isoDate,
};

export const createEmployeeSchema = z.strictObject({
  ...profileShape,
  country,
  currency,
  salaryMinor,
});

export const updateEmployeeSchema = z.strictObject({ ...profileShape, version });

export const salaryChangeSchema = z.strictObject({
  salaryMinor,
  currency,
  effectiveDate: isoDate,
  reason: text(500),
  version,
});

const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => (value ? value : undefined));

const queryInt = z.coerce.number().int();

export const listEmployeesQuerySchema = z
  .object({
    page: queryInt.min(1).default(1),
    pageSize: queryInt
      .min(1)
      .default(DEFAULT_PAGE_SIZE)
      .transform((size) => Math.min(size, MAX_PAGE_SIZE)),
    sort: z.enum(SORT_FIELDS).default('name'),
    order: z.enum(['asc', 'desc']).default('asc'),
    search: optionalText,
    country: country.optional(),
    department: optionalText,
    jobTitle: optionalText,
    currency: currency.optional(),
    minSalary: queryInt.min(0).optional(),
    maxSalary: queryInt.min(0).optional(),
  })
  .refine(
    (query) =>
      query.currency !== undefined ||
      (query.minSalary === undefined && query.maxSalary === undefined),
    { path: ['currency'], message: 'A salary range needs a currency' },
  )
  .refine(
    (query) =>
      query.minSalary === undefined ||
      query.maxSalary === undefined ||
      query.minSalary <= query.maxSalary,
    { path: ['minSalary'], message: 'Must not be greater than maxSalary' },
  );

export const employeeParamsSchema = z.object({ id: employeeIdSchema });
