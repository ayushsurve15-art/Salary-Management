import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIST_PARAMS,
  hasActiveFilters,
  parseListParams,
  toApiQuery,
  toSearchParams,
  updateListParams,
} from './listParams';

const parse = (query: string) => parseListParams(new URLSearchParams(query));

describe('parseListParams', () => {
  it('uses defaults for an empty URL', () => {
    expect(parse('')).toEqual(DEFAULT_LIST_PARAMS);
  });

  it('reads every supported value', () => {
    expect(
      parse('page=3&pageSize=50&sort=salary&order=desc&search=ada&country=GB&currency=GBP'),
    ).toMatchObject({
      page: 3,
      pageSize: 50,
      sort: 'salary',
      order: 'desc',
      search: 'ada',
      country: 'GB',
      currency: 'GBP',
    });
  });

  it('falls back to defaults for values a user could have typed by hand', () => {
    expect(parse('page=-2&pageSize=7&sort=password&order=sideways')).toMatchObject({
      page: 1,
      pageSize: 25,
      sort: 'name',
      order: 'asc',
    });
  });
});

describe('toSearchParams', () => {
  it('leaves defaults out so links stay short', () => {
    expect(toSearchParams(DEFAULT_LIST_PARAMS).toString()).toBe('');
  });

  it('round-trips through parseListParams', () => {
    const params = { ...DEFAULT_LIST_PARAMS, page: 4, department: 'Sales', order: 'desc' as const };

    expect(parseListParams(toSearchParams(params))).toEqual(params);
  });
});

describe('updateListParams', () => {
  const onPageFive = { ...DEFAULT_LIST_PARAMS, page: 5 };

  it('goes back to page 1 when a filter changes', () => {
    expect(updateListParams(onPageFive, { country: 'DE' })).toMatchObject({
      page: 1,
      country: 'DE',
    });
  });

  it('keeps the requested page when only paging', () => {
    expect(updateListParams(onPageFive, { page: 6 }).page).toBe(6);
  });
});

describe('hasActiveFilters', () => {
  it('ignores paging and sorting', () => {
    expect(hasActiveFilters({ ...DEFAULT_LIST_PARAMS, page: 3, sort: 'salary' })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_LIST_PARAMS, search: 'x' })).toBe(true);
  });
});

describe('toApiQuery', () => {
  it('converts the salary range to minor units of the chosen currency', () => {
    const query = toApiQuery({
      ...DEFAULT_LIST_PARAMS,
      currency: 'USD',
      minSalary: '50000',
      maxSalary: '80000.5',
    });

    expect(query).toMatchObject({ currency: 'USD', minSalary: 5_000_000, maxSalary: 8_000_050 });
  });

  it('drops the salary range when there is no currency', () => {
    const query = toApiQuery({ ...DEFAULT_LIST_PARAMS, minSalary: '50000' });

    expect(query.minSalary).toBeUndefined();
  });

  it('drops an amount that cannot be parsed instead of sending garbage', () => {
    const query = toApiQuery({ ...DEFAULT_LIST_PARAMS, currency: 'USD', minSalary: 'lots' });

    expect(query.minSalary).toBeUndefined();
  });

  it('omits empty filters', () => {
    expect(toApiQuery(DEFAULT_LIST_PARAMS)).toEqual({
      page: 1,
      pageSize: 25,
      sort: 'name',
      order: 'asc',
      search: undefined,
      country: undefined,
      department: undefined,
      jobTitle: undefined,
      currency: undefined,
      minSalary: undefined,
      maxSalary: undefined,
    });
  });
});
