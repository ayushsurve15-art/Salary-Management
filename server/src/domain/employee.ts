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

export type SalaryHistoryEntry = {
  id: number;
  salaryMinor: number;
  currency: string;
  effectiveDate: string;
  reason: string;
  createdAt: string;
};

export type EmployeeProfile = Pick<
  Employee,
  'firstName' | 'lastName' | 'email' | 'jobTitle' | 'department' | 'hireDate'
>;

export type NewEmployee = EmployeeProfile & Pick<Employee, 'country' | 'currency' | 'salaryMinor'>;

export type EmployeeUpdate = EmployeeProfile & { version: number };

export type SalaryChange = {
  salaryMinor: number;
  currency: string;
  effectiveDate: string;
  reason: string;
  version: number;
};

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

export type EmployeeFilters = {
  search?: string | undefined;
  country?: string | undefined;
  department?: string | undefined;
  jobTitle?: string | undefined;
  currency?: string | undefined;
  minSalary?: number | undefined;
  maxSalary?: number | undefined;
};

export type EmployeeListQuery = EmployeeFilters & {
  page: number;
  pageSize: number;
  sort: SortField;
  order: SortOrder;
};

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
