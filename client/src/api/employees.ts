import { apiRequest, toQueryString, type QueryValue } from './client';
import type { Employee, Meta, Page } from './types';

export type EmployeeListQuery = Record<string, QueryValue>;

export const employeesApi = {
  list: (query: EmployeeListQuery) =>
    apiRequest<Page<Employee>>(`/employees${toQueryString(query)}`),
  meta: () => apiRequest<Meta>('/meta'),
};
