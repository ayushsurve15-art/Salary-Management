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

export type GroupDimension = 'department' | 'jobTitle';

export type SalaryBand = { from: number; to: number; count: number };

export type Distribution = { currency: string; bands: SalaryBand[] };

export type Earner = Pick<
  Employee,
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'jobTitle'
  | 'department'
  | 'country'
  | 'currency'
  | 'salaryMinor'
>;

export type Earners = { currency: string; top: Earner[]; bottom: Earner[] };
