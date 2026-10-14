import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Employee, Page, SalaryHistoryEntry } from '../domain/employee.js';
import { createTestContext, employeeInput, TODAY, type TestContext } from '../testing/testApp.js';

describe('employee API', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  async function createEmployee(overrides: Record<string, unknown> = {}): Promise<Employee> {
    const response = await request(ctx.app).post('/api/employees').send(employeeInput(overrides));
    expect(response.status).toBe(201);
    return response.body as Employee;
  }

  async function listEmployees(query: Record<string, string | number>): Promise<Page<Employee>> {
    const response = await request(ctx.app).get('/api/employees').query(query);
    expect(response.status).toBe(200);
    return response.body as Page<Employee>;
  }

  async function historyOf(id: number): Promise<SalaryHistoryEntry[]> {
    const response = await request(ctx.app).get(`/api/employees/${id}/salary-history`);
    return response.body as SalaryHistoryEntry[];
  }

  describe('create and read', () => {
    it('creates an employee with an initial salary history entry', async () => {
      const created = await createEmployee();

      expect(created).toMatchObject({ id: 1, email: 'ada@example.com', salaryMinor: 6_500_000 });
      expect(created.version).toBe(1);
      expect(await historyOf(created.id)).toMatchObject([
        { salaryMinor: 6_500_000, currency: 'GBP', effectiveDate: '2020-01-06' },
      ]);

      const fetched = await request(ctx.app).get(`/api/employees/${created.id}`);
      expect(fetched.body).toEqual(created);
    });

    it('rejects a duplicate email regardless of case and whitespace', async () => {
      await createEmployee();

      const response = await request(ctx.app)
        .post('/api/employees')
        .send(employeeInput({ email: '  ADA@example.com ' }));

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({ error: { code: 'CONFLICT' } });
    });

    it('rejects a currency that does not belong to the country', async () => {
      const response = await request(ctx.app)
        .post('/api/employees')
        .send(employeeInput({ country: 'GB', currency: 'EUR' }));

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: { details: [{ path: 'currency', message: 'Must be GBP for GB' }] },
      });
    });

    it('rejects a hire date in the future', async () => {
      const response = await request(ctx.app)
        .post('/api/employees')
        .send(employeeInput({ hireDate: '2025-06-16' }));

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: { details: [{ path: 'hireDate' }] } });
    });

    it('returns 404 for an unknown id and 400 for a malformed one', async () => {
      const missing = await request(ctx.app).get('/api/employees/999');
      const malformed = await request(ctx.app).get('/api/employees/abc');

      expect(missing.status).toBe(404);
      expect(malformed.status).toBe(400);
      expect(malformed.body).toMatchObject({ error: { details: [{ path: 'id' }] } });
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await createEmployee({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });
      await createEmployee({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        country: 'US',
        currency: 'USD',
        salaryMinor: 15_000_000,
        department: 'Research',
      });
      await createEmployee({
        firstName: 'Alan',
        lastName: 'Turing',
        email: 'alan@example.com',
        salaryMinor: 8_000_000,
      });
    });

    it('paginates and reports totals', async () => {
      const page = await listEmployees({ pageSize: 2, page: 2 });

      expect(page).toMatchObject({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
      expect(page.items).toHaveLength(1);
    });

    it('returns an empty page past the last one with the real total', async () => {
      const page = await listEmployees({ page: 10 });

      expect(page).toMatchObject({ items: [], total: 3, totalPages: 1 });
    });

    it('sorts by name by default and can reverse the order', async () => {
      const ascending = await listEmployees({});
      const descending = await listEmployees({ sort: 'name', order: 'desc' });

      expect(ascending.items.map((e) => e.lastName)).toEqual(['Hopper', 'Lovelace', 'Turing']);
      expect(descending.items.map((e) => e.lastName)).toEqual(['Turing', 'Lovelace', 'Hopper']);
    });

    it('sorts salary within each currency, never across currencies', async () => {
      const ascending = await listEmployees({ sort: 'salary', order: 'asc' });
      const descending = await listEmployees({ sort: 'salary', order: 'desc' });

      expect(ascending.items.map((e) => [e.currency, e.salaryMinor])).toEqual([
        ['GBP', 6_500_000],
        ['GBP', 8_000_000],
        ['USD', 15_000_000],
      ]);
      expect(descending.items.map((e) => [e.currency, e.salaryMinor])).toEqual([
        ['USD', 15_000_000],
        ['GBP', 8_000_000],
        ['GBP', 6_500_000],
      ]);
    });

    it('searches name and email case-insensitively', async () => {
      const byName = await listEmployees({ search: 'grace hop' });
      const byEmail = await listEmployees({ search: 'ALAN@' });

      expect(byName.items.map((e) => e.firstName)).toEqual(['Grace']);
      expect(byEmail.items.map((e) => e.firstName)).toEqual(['Alan']);
    });

    it('treats LIKE wildcards in the search as plain text', async () => {
      const page = await listEmployees({ search: '%' });

      expect(page.total).toBe(0);
    });

    it('combines filters for country, department and salary range', async () => {
      const gbOnly = await listEmployees({ country: 'GB' });
      const research = await listEmployees({ department: 'Research' });
      const range = await listEmployees({
        currency: 'GBP',
        minSalary: 7_000_000,
        maxSalary: 9_000_000,
      });

      expect(gbOnly.total).toBe(2);
      expect(research.items.map((e) => e.firstName)).toEqual(['Grace']);
      expect(range.items.map((e) => e.firstName)).toEqual(['Alan']);
    });

    it('returns an empty result when nothing matches', async () => {
      const page = await listEmployees({ jobTitle: 'Astronaut' });

      expect(page).toMatchObject({ items: [], total: 0, totalPages: 0 });
    });

    it('rejects an unknown sort field', async () => {
      const response = await request(ctx.app).get('/api/employees').query({ sort: 'password' });

      expect(response.status).toBe(400);
    });

    it('lists departments and job titles for the filters', async () => {
      const response = await request(ctx.app).get('/api/meta');

      expect(response.body).toMatchObject({
        departments: ['Engineering', 'Research'],
        jobTitles: ['Software Engineer'],
      });
    });
  });

  describe('update', () => {
    it('updates the profile and bumps the version', async () => {
      const created = await createEmployee();

      const response = await request(ctx.app)
        .put(`/api/employees/${created.id}`)
        .send({ ...profileOf(created), jobTitle: 'Staff Engineer', version: created.version });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ jobTitle: 'Staff Engineer', version: 2 });
    });

    it('rejects a stale version with 409', async () => {
      const created = await createEmployee();
      const update = { ...profileOf(created), version: created.version };
      await request(ctx.app).put(`/api/employees/${created.id}`).send(update);

      const stale = await request(ctx.app).put(`/api/employees/${created.id}`).send(update);

      expect(stale.status).toBe(409);
    });

    it('rejects taking another employee email', async () => {
      await createEmployee({ email: 'grace@example.com' });
      const ada = await createEmployee();

      const response = await request(ctx.app)
        .put(`/api/employees/${ada.id}`)
        .send({ ...profileOf(ada), email: 'Grace@Example.com', version: ada.version });

      expect(response.status).toBe(409);
    });

    it('does not allow changing the country', async () => {
      const created = await createEmployee();

      const response = await request(ctx.app)
        .put(`/api/employees/${created.id}`)
        .send({ ...profileOf(created), country: 'US', version: created.version });

      expect(response.status).toBe(400);
    });

    it('rejects a hire date after the first salary date', async () => {
      const created = await createEmployee();

      const response = await request(ctx.app)
        .put(`/api/employees/${created.id}`)
        .send({ ...profileOf(created), hireDate: '2021-01-01', version: created.version });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: { details: [{ path: 'hireDate' }] } });
    });

    it('returns 404 when the employee does not exist', async () => {
      const response = await request(ctx.app)
        .put('/api/employees/999')
        .send({ ...profileOf(await createEmployee()), version: 1 });

      expect(response.status).toBe(404);
    });
  });

  describe('salary changes', () => {
    const change = (overrides: Record<string, unknown> = {}) => ({
      salaryMinor: 7_000_000,
      currency: 'GBP',
      effectiveDate: '2024-04-01',
      reason: 'Promotion',
      version: 1,
      ...overrides,
    });

    it('records history and updates the current salary', async () => {
      const created = await createEmployee();

      const response = await request(ctx.app)
        .post(`/api/employees/${created.id}/salary-changes`)
        .send(change());

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ salaryMinor: 7_000_000, version: 2 });
      expect((await historyOf(created.id)).map((h) => [h.effectiveDate, h.reason])).toEqual([
        ['2024-04-01', 'Promotion'],
        ['2020-01-06', 'Initial salary'],
      ]);
    });

    it('keeps the latest salary current when a change is back-dated', async () => {
      const created = await createEmployee();
      await request(ctx.app)
        .post(`/api/employees/${created.id}/salary-changes`)
        .send(change({ salaryMinor: 9_000_000, effectiveDate: '2024-04-01' }));

      const response = await request(ctx.app)
        .post(`/api/employees/${created.id}/salary-changes`)
        .send(change({ salaryMinor: 7_000_000, effectiveDate: '2022-04-01', version: 2 }));

      expect(response.body).toMatchObject({ salaryMinor: 9_000_000, version: 3 });
      expect(await historyOf(created.id)).toHaveLength(3);
    });

    it.each([
      ['before the hire date', '2019-12-31'],
      ['in the future', '2025-06-16'],
      ['far in the future', '2999-01-01'],
    ])('rejects an effective date %s', async (_label, effectiveDate) => {
      const created = await createEmployee();

      const response = await request(ctx.app)
        .post(`/api/employees/${created.id}/salary-changes`)
        .send(change({ effectiveDate }));

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: { details: [{ path: 'effectiveDate' }] } });
    });

    it('accepts an effective date of today', async () => {
      const created = await createEmployee();

      const response = await request(ctx.app)
        .post(`/api/employees/${created.id}/salary-changes`)
        .send(change({ effectiveDate: TODAY }));

      expect(response.status).toBe(200);
    });

    it('rejects a currency other than the employee currency', async () => {
      const created = await createEmployee();

      const response = await request(ctx.app)
        .post(`/api/employees/${created.id}/salary-changes`)
        .send(change({ currency: 'USD' }));

      expect(response.status).toBe(400);
    });

    it('rolls back the history entry when the version is stale', async () => {
      const created = await createEmployee();

      const response = await request(ctx.app)
        .post(`/api/employees/${created.id}/salary-changes`)
        .send(change({ version: 5 }));

      expect(response.status).toBe(409);
      expect(await historyOf(created.id)).toHaveLength(1);
    });

    it('returns 404 for an unknown employee', async () => {
      const response = await request(ctx.app)
        .post('/api/employees/999/salary-changes')
        .send(change());

      expect(response.status).toBe(404);
    });
  });

  describe('delete', () => {
    it('deletes an employee together with their salary history', async () => {
      const created = await createEmployee();
      await request(ctx.app).post(`/api/employees/${created.id}/salary-changes`).send({
        salaryMinor: 7_000_000,
        currency: 'GBP',
        effectiveDate: '2024-04-01',
        reason: 'Promotion',
        version: 1,
      });

      const response = await request(ctx.app).delete(`/api/employees/${created.id}`);

      expect(response.status).toBe(204);
      expect((await request(ctx.app).get(`/api/employees/${created.id}`)).status).toBe(404);
      const remaining = ctx.db.prepare('SELECT COUNT(*) AS count FROM salary_history').get();
      expect(remaining).toEqual({ count: 0 });
    });

    it('returns 404 when deleting an unknown employee', async () => {
      expect((await request(ctx.app).delete('/api/employees/999')).status).toBe(404);
    });
  });
});

function profileOf(employee: Employee) {
  const { firstName, lastName, email, jobTitle, department, hireDate } = employee;
  return { firstName, lastName, email, jobTitle, department, hireDate };
}
