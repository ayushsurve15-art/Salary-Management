import { apiRequest, toQueryString, type QueryValue } from './client';
import type {
  CreateEmployeeInput,
  Employee,
  Meta,
  Page,
  SalaryChangeInput,
  SalaryHistoryEntry,
  UpdateEmployeeInput,
} from './types';

export type EmployeeListQuery = Record<string, QueryValue>;

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const employeesApi = {
  list: (query: EmployeeListQuery) =>
    apiRequest<Page<Employee>>(`/employees${toQueryString(query)}`),
  meta: () => apiRequest<Meta>('/meta'),
  get: (id: number) => apiRequest<Employee>(`/employees/${id}`),
  create: (input: CreateEmployeeInput) => apiRequest<Employee>('/employees', json('POST', input)),
  update: (id: number, input: UpdateEmployeeInput) =>
    apiRequest<Employee>(`/employees/${id}`, json('PUT', input)),
  remove: (id: number) => apiRequest<void>(`/employees/${id}`, { method: 'DELETE' }),
  history: (id: number) => apiRequest<SalaryHistoryEntry[]>(`/employees/${id}/salary-history`),
  changeSalary: (id: number, input: SalaryChangeInput) =>
    apiRequest<Employee>(`/employees/${id}/salary-changes`, json('POST', input)),
};
