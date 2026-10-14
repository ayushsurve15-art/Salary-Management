import type {
  Country,
  CreateEmployeeInput,
  Employee,
  SalaryChangeInput,
  UpdateEmployeeInput,
} from '../../api/types';
import { isIsoDate } from '../../lib/dates';
import { fromMinorUnits, toMinorUnits } from '../../lib/money';

// Mirrors the API limits so most mistakes are caught before a round trip.
const MAX_TEXT = 100;
const MAX_EMAIL = 254;
const MAX_REASON = 500;
export const MAX_SALARY_MINOR = 1_000_000_000_000;

export type EmployeeFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  salary: string;
  hireDate: string;
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export const EMPTY_EMPLOYEE_FORM: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  jobTitle: '',
  department: '',
  country: '',
  salary: '',
  hireDate: '',
};

export function employeeToFormValues(employee: Employee): EmployeeFormValues {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    department: employee.department,
    country: employee.country,
    salary: fromMinorUnits(employee.salaryMinor, employee.currency),
    hireDate: employee.hireDate,
  };
}

function textError(value: string, max: number): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return 'Must not be empty';
  if (trimmed.length > max) return `Must be at most ${max} characters`;
  return undefined;
}

function dateError(value: string, today: string): string | undefined {
  if (!isIsoDate(value)) return 'Must be a valid date';
  if (value > today) return 'Must not be in the future';
  return undefined;
}

export function salaryError(value: string, currency: string | undefined): string | undefined {
  if (value.trim() === '') return 'Must not be empty';
  if (currency === undefined) return 'Pick a country first';
  const minor = toMinorUnits(value, currency);
  if (minor === null) return 'Must be a plain amount, like 65000 or 65000.50';
  if (minor <= 0) return 'Must be greater than zero';
  if (minor > MAX_SALARY_MINOR) return 'Is unrealistically large';
  return undefined;
}

function compact<T>(errors: { [K in keyof T]?: string | undefined }): FormErrors<T> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as FormErrors<T>;
}

export function validateEmployeeForm(
  values: EmployeeFormValues,
  options: { mode: 'create' | 'edit'; countries: Country[]; today: string },
): FormErrors<EmployeeFormValues> {
  const email = values.email.trim();
  const currency = options.countries.find((c) => c.code === values.country)?.currency;
  return compact<EmployeeFormValues>({
    firstName: textError(values.firstName, MAX_TEXT),
    lastName: textError(values.lastName, MAX_TEXT),
    email:
      email === ''
        ? 'Must not be empty'
        : email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          ? 'Must be a valid email'
          : undefined,
    jobTitle: textError(values.jobTitle, MAX_TEXT),
    department: textError(values.department, MAX_TEXT),
    hireDate: dateError(values.hireDate, options.today),
    ...(options.mode === 'create' && {
      country: currency === undefined ? 'Pick a country' : undefined,
      salary: salaryError(values.salary, currency),
    }),
  });
}

function profile(values: EmployeeFormValues) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    jobTitle: values.jobTitle.trim(),
    department: values.department.trim(),
    hireDate: values.hireDate,
  };
}

/** Call only after {@link validateEmployeeForm} reports no errors. */
export function toCreateInput(values: EmployeeFormValues, currency: string): CreateEmployeeInput {
  return {
    ...profile(values),
    country: values.country,
    currency,
    salaryMinor: toMinorUnits(values.salary, currency) ?? 0,
  };
}

export function toUpdateInput(values: EmployeeFormValues, version: number): UpdateEmployeeInput {
  return { ...profile(values), version };
}

export type SalaryChangeValues = { amount: string; effectiveDate: string; reason: string };

export function validateSalaryChange(
  values: SalaryChangeValues,
  options: { currency: string; hireDate: string; today: string },
): FormErrors<SalaryChangeValues> {
  const effectiveDate =
    dateError(values.effectiveDate, options.today) ??
    (values.effectiveDate < options.hireDate
      ? `Must not be before the hire date (${options.hireDate})`
      : undefined);
  return compact<SalaryChangeValues>({
    amount: salaryError(values.amount, options.currency),
    effectiveDate,
    reason: textError(values.reason, MAX_REASON),
  });
}

export function toSalaryChangeInput(
  values: SalaryChangeValues,
  employee: Pick<Employee, 'currency' | 'version'>,
): SalaryChangeInput {
  return {
    salaryMinor: toMinorUnits(values.amount, employee.currency) ?? 0,
    currency: employee.currency,
    effectiveDate: values.effectiveDate,
    reason: values.reason.trim(),
    version: employee.version,
  };
}
