import type { Db } from '../db/connection.js';
import type { SeedEmployee } from '../seed/generateEmployees.js';

export type SeedRepository = ReturnType<typeof createSeedRepository>;

export function createSeedRepository(db: Db) {
  const insertEmployee = db.prepare<[Omit<SeedEmployee, 'history'> & { now: string }]>(
    `INSERT INTO employees (first_name, last_name, email, job_title, department, country, currency,
       salary_minor, hire_date, created_at, updated_at)
     VALUES (@firstName, @lastName, @email, @jobTitle, @department, @country, @currency,
       @salaryMinor, @hireDate, @now, @now)`,
  );
  const insertHistory = db.prepare<
    [
      {
        employeeId: number;
        salaryMinor: number;
        currency: string;
        effectiveDate: string;
        reason: string;
        now: string;
      },
    ]
  >(
    `INSERT INTO salary_history (employee_id, salary_minor, currency, effective_date, reason, created_at)
     VALUES (@employeeId, @salaryMinor, @currency, @effectiveDate, @reason, @now)`,
  );

  return {
    /** Replaces all employees and history in one transaction, so a re-run starts from scratch. */
    replaceAll(employees: SeedEmployee[], now: string): void {
      db.transaction(() => {
        db.exec(`DELETE FROM salary_history;
          DELETE FROM employees;
          DELETE FROM sqlite_sequence WHERE name IN ('employees', 'salary_history');`);
        for (const { history, ...employee } of employees) {
          const employeeId = Number(insertEmployee.run({ ...employee, now }).lastInsertRowid);
          for (const entry of history) {
            insertHistory.run({ employeeId, currency: employee.currency, now, ...entry });
          }
        }
      })();
    },
  };
}
