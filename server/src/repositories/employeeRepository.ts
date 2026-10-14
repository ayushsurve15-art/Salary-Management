import type { Db } from '../db/connection.js';
import type {
  Employee,
  EmployeeFilters,
  EmployeeListQuery,
  EmployeeUpdate,
  NewEmployee,
  SalaryHistoryEntry,
  SortField,
} from '../domain/employee.js';

type EmployeeRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department: string;
  country: string;
  currency: string;
  salary_minor: number;
  hire_date: string;
  version: number;
  created_at: string;
  updated_at: string;
};

type HistoryRow = {
  id: number;
  salary_minor: number;
  currency: string;
  effective_date: string;
  reason: string;
  created_at: string;
};

type HistoryInsert = Omit<SalaryHistoryEntry, 'id'> & { employeeId: number };

type SqlParams = Record<string, string | number>;

const EMPLOYEE_COLUMNS = `id, first_name, last_name, email, job_title, department, country, currency,
  salary_minor, hire_date, version, created_at, updated_at`;

const HISTORY_COLUMNS = 'id, salary_minor, currency, effective_date, reason, created_at';

// The only place user-chosen sort fields become SQL; anything not listed here cannot be sorted on.
const SORT_COLUMNS: Record<SortField, string[]> = {
  name: ['last_name', 'first_name'],
  email: ['email'],
  country: ['country'],
  department: ['department'],
  jobTitle: ['job_title'],
  salary: ['salary_minor'],
  hireDate: ['hire_date'],
};

function toEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    jobTitle: row.job_title,
    department: row.department,
    country: row.country,
    currency: row.currency,
    salaryMinor: row.salary_minor,
    hireDate: row.hire_date,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toHistoryEntry(row: HistoryRow): SalaryHistoryEntry {
  return {
    id: row.id,
    salaryMinor: row.salary_minor,
    currency: row.currency,
    effectiveDate: row.effective_date,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function buildWhereClause(filters: EmployeeFilters): { where: string; params: SqlParams } {
  const conditions: string[] = [];
  const params: SqlParams = {};

  if (filters.search !== undefined) {
    conditions.push(
      `((first_name || ' ' || last_name) LIKE @search ESCAPE '\\' OR email LIKE @search ESCAPE '\\')`,
    );
    params.search = `%${escapeLike(filters.search)}%`;
  }
  const equalityFilters = [
    ['country', filters.country],
    ['department', filters.department],
    ['job_title', filters.jobTitle],
    ['currency', filters.currency],
  ] as const;
  for (const [column, value] of equalityFilters) {
    if (value !== undefined) {
      conditions.push(`${column} = @${column}`);
      params[column] = value;
    }
  }
  if (filters.minSalary !== undefined) {
    conditions.push('salary_minor >= @minSalary');
    params.minSalary = filters.minSalary;
  }
  if (filters.maxSalary !== undefined) {
    conditions.push('salary_minor <= @maxSalary');
    params.maxSalary = filters.maxSalary;
  }

  return { where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

export function buildOrderBy(sort: SortField, order: 'asc' | 'desc'): string {
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  // Amounts in different currencies are not comparable, so salary order is per currency.
  const prefix = sort === 'salary' ? ['currency ASC'] : [];
  const columns = SORT_COLUMNS[sort].map((column) => `${column} ${direction}`);
  return `ORDER BY ${[...prefix, ...columns, `id ${direction}`].join(', ')}`;
}

export type EmployeeRepository = ReturnType<typeof createEmployeeRepository>;

export function createEmployeeRepository(db: Db) {
  const statements = {
    findById: db.prepare<[number], EmployeeRow>(
      `SELECT ${EMPLOYEE_COLUMNS} FROM employees WHERE id = ?`,
    ),
    findIdByEmail: db.prepare<[string], { id: number }>('SELECT id FROM employees WHERE email = ?'),
    insert: db.prepare<[NewEmployee & { now: string }]>(
      `INSERT INTO employees (first_name, last_name, email, job_title, department, country, currency,
         salary_minor, hire_date, created_at, updated_at)
       VALUES (@firstName, @lastName, @email, @jobTitle, @department, @country, @currency,
         @salaryMinor, @hireDate, @now, @now)`,
    ),
    update: db.prepare<[EmployeeUpdate & { id: number; now: string }]>(
      `UPDATE employees
       SET first_name = @firstName, last_name = @lastName, email = @email, job_title = @jobTitle,
         department = @department, hire_date = @hireDate, version = version + 1, updated_at = @now
       WHERE id = @id AND version = @version`,
    ),
    updateSalary: db.prepare<[{ id: number; salaryMinor: number; version: number; now: string }]>(
      `UPDATE employees
       SET salary_minor = @salaryMinor, version = version + 1, updated_at = @now
       WHERE id = @id AND version = @version`,
    ),
    delete: db.prepare<[number]>('DELETE FROM employees WHERE id = ?'),
    insertHistory: db.prepare<[HistoryInsert]>(
      `INSERT INTO salary_history (employee_id, salary_minor, currency, effective_date, reason, created_at)
       VALUES (@employeeId, @salaryMinor, @currency, @effectiveDate, @reason, @createdAt)`,
    ),
    listHistory: db.prepare<[number], HistoryRow>(
      `SELECT ${HISTORY_COLUMNS} FROM salary_history
       WHERE employee_id = ? ORDER BY effective_date DESC, id DESC`,
    ),
    latestHistory: db.prepare<[number], HistoryRow>(
      `SELECT ${HISTORY_COLUMNS} FROM salary_history
       WHERE employee_id = ? ORDER BY effective_date DESC, id DESC LIMIT 1`,
    ),
    earliestEffectiveDate: db.prepare<[number], { effective_date: string }>(
      'SELECT MIN(effective_date) AS effective_date FROM salary_history WHERE employee_id = ?',
    ),
    distinctDepartments: db.prepare<[], { value: string }>(
      'SELECT DISTINCT department AS value FROM employees ORDER BY department',
    ),
    distinctJobTitles: db.prepare<[], { value: string }>(
      'SELECT DISTINCT job_title AS value FROM employees ORDER BY job_title',
    ),
  };

  return {
    transaction: <T>(work: () => T): T => db.transaction(work)(),

    list(query: EmployeeListQuery): { items: Employee[]; total: number } {
      const { where, params } = buildWhereClause(query);
      const countRow = db
        .prepare<[SqlParams], { total: number }>(`SELECT COUNT(*) AS total FROM employees ${where}`)
        .get(params);
      const rows = db
        .prepare<[SqlParams], EmployeeRow>(
          `SELECT ${EMPLOYEE_COLUMNS} FROM employees ${where}
           ${buildOrderBy(query.sort, query.order)} LIMIT @limit OFFSET @offset`,
        )
        .all({ ...params, limit: query.pageSize, offset: (query.page - 1) * query.pageSize });
      return { items: rows.map(toEmployee), total: countRow?.total ?? 0 };
    },

    findById(id: number): Employee | undefined {
      const row = statements.findById.get(id);
      return row ? toEmployee(row) : undefined;
    },

    findIdByEmail(email: string): number | undefined {
      return statements.findIdByEmail.get(email)?.id;
    },

    insert(employee: NewEmployee, now: string): number {
      return Number(statements.insert.run({ ...employee, now }).lastInsertRowid);
    },

    /** Returns false when the row is missing or its version has moved on. */
    update(id: number, update: EmployeeUpdate, now: string): boolean {
      return statements.update.run({ ...update, id, now }).changes === 1;
    },

    updateSalary(id: number, salaryMinor: number, version: number, now: string): boolean {
      return statements.updateSalary.run({ id, salaryMinor, version, now }).changes === 1;
    },

    delete(id: number): boolean {
      return statements.delete.run(id).changes === 1;
    },

    insertHistory(entry: HistoryInsert): void {
      statements.insertHistory.run(entry);
    },

    listHistory(employeeId: number): SalaryHistoryEntry[] {
      return statements.listHistory.all(employeeId).map(toHistoryEntry);
    },

    latestHistory(employeeId: number): SalaryHistoryEntry | undefined {
      const row = statements.latestHistory.get(employeeId);
      return row ? toHistoryEntry(row) : undefined;
    },

    earliestEffectiveDate(employeeId: number): string | undefined {
      return statements.earliestEffectiveDate.get(employeeId)?.effective_date ?? undefined;
    },

    departments: (): string[] => statements.distinctDepartments.all().map((row) => row.value),

    jobTitles: (): string[] => statements.distinctJobTitles.all().map((row) => row.value),
  };
}
