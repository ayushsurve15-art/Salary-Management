export type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salaryMinor: number;
  hireDate: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Country = { code: string; name: string; currency: string };

export type Meta = { countries: Country[]; departments: string[]; jobTitles: string[] };

export const SORT_FIELDS = [
  'name',
  'email',
  'country',
  'department',
  'jobTitle',
  'salary',
  'hireDate',
] as const;

export type SortField = (typeof SORT_FIELDS)[number];

export type SortOrder = 'asc' | 'desc';

export type ErrorDetail = { path: string; message: string };

export type SalaryHistoryEntry = {
  id: number;
  salaryMinor: number;
  currency: string;
  effectiveDate: string;
  reason: string;
  createdAt: string;
};

export type EmployeeProfileInput = {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  hireDate: string;
};

export type CreateEmployeeInput = EmployeeProfileInput & {
  country: string;
  currency: string;
  salaryMinor: number;
};

export type UpdateEmployeeInput = EmployeeProfileInput & { version: number };

export type SalaryChangeInput = {
  salaryMinor: number;
  currency: string;
  effectiveDate: string;
  reason: string;
  version: number;
};
