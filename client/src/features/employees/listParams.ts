import type { EmployeeListQuery } from '../../api/employees';
import { SORT_FIELDS, type SortField, type SortOrder } from '../../api/types';
import { toMinorUnits } from '../../lib/money';

/** Everything that defines the employee list view. Lives in the URL so views can be shared. */
export type ListParams = {
  page: number;
  pageSize: number;
  sort: SortField;
  order: SortOrder;
  search: string;
  country: string;
  department: string;
  jobTitle: string;
  currency: string;
  /** Major units as typed, e.g. "50000". Converted to minor units for the API. */
  minSalary: string;
  maxSalary: string;
};

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export const DEFAULT_LIST_PARAMS: ListParams = {
  page: 1,
  pageSize: 25,
  sort: 'name',
  order: 'asc',
  search: '',
  country: '',
  department: '',
  jobTitle: '',
  currency: '',
  minSalary: '',
  maxSalary: '',
};

const TEXT_KEYS = [
  'search',
  'country',
  'department',
  'jobTitle',
  'currency',
  'minSalary',
  'maxSalary',
] as const;

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isSortField(value: string | null): value is SortField {
  return SORT_FIELDS.some((field) => field === value);
}

/** Reads list state from the URL, falling back to defaults for anything missing or invalid. */
export function parseListParams(search: URLSearchParams): ListParams {
  const pageSize = positiveInt(search.get('pageSize'), DEFAULT_LIST_PARAMS.pageSize);
  const sort = search.get('sort');
  const params: ListParams = {
    ...DEFAULT_LIST_PARAMS,
    page: positiveInt(search.get('page'), 1),
    pageSize: PAGE_SIZES.some((size) => size === pageSize)
      ? pageSize
      : DEFAULT_LIST_PARAMS.pageSize,
    sort: isSortField(sort) ? sort : DEFAULT_LIST_PARAMS.sort,
    order: search.get('order') === 'desc' ? 'desc' : 'asc',
  };
  for (const key of TEXT_KEYS) {
    params[key] = search.get(key)?.trim() ?? '';
  }
  return params;
}

/** Writes list state to the URL, leaving out defaults to keep links short. */
export function toSearchParams(params: ListParams): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== DEFAULT_LIST_PARAMS[key as keyof ListParams]) search.set(key, String(value));
  }
  return search;
}

/** Applies a change; any change other than paging sends the user back to the first page. */
export function updateListParams(current: ListParams, change: Partial<ListParams>): ListParams {
  const resetsPage = Object.keys(change).some((key) => key !== 'page');
  return { ...current, ...(resetsPage ? { page: 1 } : {}), ...change };
}

export function hasActiveFilters(params: ListParams): boolean {
  return TEXT_KEYS.some((key) => params[key] !== '');
}

/** The salary range only means something within a currency, matching the API rule. */
export function toApiQuery(params: ListParams): EmployeeListQuery {
  const salaryBound = (value: string) =>
    params.currency && value ? (toMinorUnits(value, params.currency) ?? undefined) : undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    order: params.order,
    search: params.search || undefined,
    country: params.country || undefined,
    department: params.department || undefined,
    jobTitle: params.jobTitle || undefined,
    currency: params.currency || undefined,
    minSalary: salaryBound(params.minSalary),
    maxSalary: salaryBound(params.maxSalary),
  };
}
