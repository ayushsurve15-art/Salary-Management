import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { ApiError } from '../../api/client';
import { employeesApi } from '../../api/employees';
import type { CreateEmployeeInput, SalaryChangeInput, UpdateEmployeeInput } from '../../api/types';
import { toApiQuery, type ListParams } from './listParams';

const employeeKeys = {
  all: ['employees'] as const,
  list: (params: ListParams) => [...employeeKeys.all, 'list', toApiQuery(params)] as const,
  detail: (id: number) => [...employeeKeys.all, 'detail', id] as const,
  history: (id: number) => [...employeeKeys.all, 'history', id] as const,
  meta: ['meta'] as const,
};

/** Anything that changes an employee can change lists, filter options and insights. */
function invalidateAfterWrite(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (query) => ['employees', 'meta', 'insights'].includes(String(query.queryKey[0])),
  });
}

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

export function useEmployee(id: number) {
  return useQuery({ queryKey: employeeKeys.detail(id), queryFn: () => employeesApi.get(id) });
}

export function useSalaryHistory(id: number) {
  return useQuery({ queryKey: employeeKeys.history(id), queryFn: () => employeesApi.history(id) });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => employeesApi.create(input),
    onSuccess: () => invalidateAfterWrite(queryClient),
  });
}

export function useUpdateEmployee(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => employeesApi.update(id, input),
    onSuccess: () => invalidateAfterWrite(queryClient),
  });
}

export function useDeleteEmployee(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => employeesApi.remove(id),
    // Not awaited, so the caller can navigate away before the deleted employee is refetched.
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: employeeKeys.detail(id) });
      queryClient.removeQueries({ queryKey: employeeKeys.history(id) });
      void invalidateAfterWrite(queryClient);
    },
  });
}

export function useChangeSalary(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SalaryChangeInput) => employeesApi.changeSalary(id, input),
    onSuccess: () => invalidateAfterWrite(queryClient),
    // A stale version means someone else saved first; fetch their version so a retry can succeed.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
      }
    },
  });
}
