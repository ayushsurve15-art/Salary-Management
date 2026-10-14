import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { employeesApi } from '../../api/employees';
import { toApiQuery, type ListParams } from './listParams';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (params: ListParams) => [...employeeKeys.all, 'list', toApiQuery(params)] as const,
  meta: ['meta'] as const,
};

export function useEmployeeList(params: ListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeesApi.list(toApiQuery(params)),
    // Keeps the current page on screen while the next one loads, so the table does not flash.
    placeholderData: keepPreviousData,
  });
}

export function useMeta() {
  return useQuery({ queryKey: employeeKeys.meta, queryFn: employeesApi.meta, staleTime: 60_000 });
}
