import type { Employee, Meta } from '../api/types';

export const meta: Meta = {
  countries: [
    { code: 'DE', name: 'Germany', currency: 'EUR' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'JP', name: 'Japan', currency: 'JPY' },
  ],
  departments: ['Engineering', 'Sales'],
  jobTitles: ['Account Executive', 'Software Engineer'],
};

export function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 7,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    country: 'GB',
    currency: 'GBP',
    salaryMinor: 6_500_000,
    hireDate: '2020-01-06',
    version: 3,
    createdAt: '2020-01-06T00:00:00.000Z',
    updatedAt: '2020-01-06T00:00:00.000Z',
    ...overrides,
  };
}
