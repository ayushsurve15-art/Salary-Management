import { COUNTRIES, findCountry, type Country } from '../domain/countries.js';
import { toIsoDate, type Clock } from '../domain/dates.js';
import {
  INITIAL_SALARY_REASON,
  type Employee,
  type EmployeeListQuery,
  type EmployeeUpdate,
  type NewEmployee,
  type Page,
  type SalaryChange,
  type SalaryHistoryEntry,
} from '../domain/employee.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors.js';
import type { EmployeeRepository } from '../repositories/employeeRepository.js';

export type EmployeeMeta = {
  countries: readonly Country[];
  departments: string[];
  jobTitles: string[];
};

export type EmployeeService = ReturnType<typeof createEmployeeService>;

export function createEmployeeService(repository: EmployeeRepository, clock: Clock) {
  const today = () => toIsoDate(clock());
  const now = () => clock().toISOString();

  function getOrThrow(id: number): Employee {
    const employee = repository.findById(id);
    if (!employee) throw new NotFoundError(`Employee ${id} not found`);
    return employee;
  }

  function assertEmailAvailable(email: string, ownId?: number): void {
    const existingId = repository.findIdByEmail(email);
    if (existingId !== undefined && existingId !== ownId) {
      throw new ConflictError('An employee with this email already exists');
    }
  }

  function assertNotInFuture(field: string, date: string): void {
    if (date > today()) {
      throw new ValidationError('Invalid request', [
        { path: field, message: 'Must not be in the future' },
      ]);
    }
  }

  function assertCurrencyMatches(country: string, currency: string): void {
    const expected = findCountry(country)?.currency;
    if (expected !== currency) {
      throw new ValidationError('Invalid request', [
        {
          path: 'currency',
          message: `Must be ${expected ?? 'the country currency'} for ${country}`,
        },
      ]);
    }
  }

  // A stale version and a concurrent delete look the same to the UPDATE, so tell them apart here.
  function staleOrMissing(id: number): never {
    getOrThrow(id);
    throw new ConflictError('This employee was changed by someone else. Reload and try again.');
  }

  return {
    list(query: EmployeeListQuery): Page<Employee> {
      const { items, total } = repository.list(query);
      return {
        items,
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      };
    },

    get: getOrThrow,

    meta(): EmployeeMeta {
      return {
        countries: COUNTRIES,
        departments: repository.departments(),
        jobTitles: repository.jobTitles(),
      };
    },

    create(input: NewEmployee): Employee {
      assertCurrencyMatches(input.country, input.currency);
      assertNotInFuture('hireDate', input.hireDate);
      assertEmailAvailable(input.email);

      const timestamp = now();
      const id = repository.transaction(() => {
        const newId = repository.insert(input, timestamp);
        repository.insertHistory({
          employeeId: newId,
          salaryMinor: input.salaryMinor,
          currency: input.currency,
          effectiveDate: input.hireDate,
          reason: INITIAL_SALARY_REASON,
          createdAt: timestamp,
        });
        return newId;
      });
      return getOrThrow(id);
    },

    update(id: number, input: EmployeeUpdate): Employee {
      getOrThrow(id);
      assertNotInFuture('hireDate', input.hireDate);
      assertEmailAvailable(input.email, id);
      const earliest = repository.earliestEffectiveDate(id);
      if (earliest !== undefined && input.hireDate > earliest) {
        throw new ValidationError('Invalid request', [
          { path: 'hireDate', message: `Must not be after the first salary date (${earliest})` },
        ]);
      }

      if (!repository.update(id, input, now())) staleOrMissing(id);
      return getOrThrow(id);
    },

    delete(id: number): void {
      if (!repository.delete(id)) throw new NotFoundError(`Employee ${id} not found`);
    },

    history(id: number): SalaryHistoryEntry[] {
      getOrThrow(id);
      return repository.listHistory(id);
    },

    changeSalary(id: number, change: SalaryChange): Employee {
      const employee = getOrThrow(id);
      assertCurrencyMatches(employee.country, change.currency);
      assertNotInFuture('effectiveDate', change.effectiveDate);
      if (change.effectiveDate < employee.hireDate) {
        throw new ValidationError('Invalid request', [
          {
            path: 'effectiveDate',
            message: `Must not be before the hire date (${employee.hireDate})`,
          },
        ]);
      }

      const timestamp = now();
      repository.transaction(() => {
        repository.insertHistory({
          employeeId: id,
          salaryMinor: change.salaryMinor,
          currency: change.currency,
          effectiveDate: change.effectiveDate,
          reason: change.reason,
          createdAt: timestamp,
        });
        // A back-dated change may not be the latest one, so the current salary comes from history.
        const current = repository.latestHistory(id) ?? change;
        if (!repository.updateSalary(id, current.salaryMinor, change.version, timestamp)) {
          staleOrMissing(id);
        }
      });
      return getOrThrow(id);
    },
  };
}
