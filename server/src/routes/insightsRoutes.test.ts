import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  CountryStats,
  Distribution,
  Earners,
  GroupStats,
} from '../services/insightsService.js';
import { createTestContext, employeeInput, type TestContext } from '../testing/testApp.js';

describe('insights API', () => {
  let ctx: TestContext;
  let emailCounter = 0;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  async function hire(overrides: Record<string, unknown>): Promise<void> {
    emailCounter += 1;
    const response = await request(ctx.app)
      .post('/api/employees')
      .send(employeeInput({ email: `person${emailCounter}@example.com`, ...overrides }));
    expect(response.status).toBe(201);
  }

  async function get<T>(path: string, query: Record<string, string | number> = {}): Promise<T> {
    const response = await request(ctx.app).get(path).query(query);
    expect(response.status).toBe(200);
    return response.body as T;
  }

  describe('with no employees', () => {
    it('returns empty results rather than errors', async () => {
      expect(await get('/api/insights/countries')).toEqual([]);
      expect(await get('/api/insights/groups', { by: 'department', currency: 'USD' })).toEqual([]);
      expect(await get('/api/insights/distribution', { currency: 'USD' })).toEqual({
        currency: 'USD',
        bands: [],
      });
      expect(await get('/api/insights/earners', { currency: 'USD' })).toEqual({
        currency: 'USD',
        top: [],
        bottom: [],
      });
    });
  });

  describe('with a small organisation', () => {
    beforeEach(async () => {
      await hire({ country: 'DE', currency: 'EUR', salaryMinor: 5_000_000, department: 'Sales' });
      await hire({ country: 'DE', currency: 'EUR', salaryMinor: 7_000_000, department: 'Sales' });
      await hire({ country: 'FR', currency: 'EUR', salaryMinor: 6_000_000 });
      await hire({ country: 'FR', currency: 'EUR', salaryMinor: 9_000_000 });
      await hire({ country: 'US', currency: 'USD', salaryMinor: 12_000_000 });
    });

    it('reports headcount, min, max, average and median per country', async () => {
      const countries = await get<CountryStats[]>('/api/insights/countries');

      expect(countries).toEqual([
        {
          key: 'DE',
          countryName: 'Germany',
          currency: 'EUR',
          headcount: 2,
          min: 5_000_000,
          max: 7_000_000,
          average: 6_000_000,
          median: 6_000_000,
          p25: 5_500_000,
          p75: 6_500_000,
        },
        expect.objectContaining({ key: 'FR', headcount: 2, median: 7_500_000 }),
        expect.objectContaining({ key: 'US', headcount: 1, median: 12_000_000, p25: 12_000_000 }),
      ]);
    });

    it('groups departments within one currency and never mixes in other currencies', async () => {
      const groups = await get<GroupStats[]>('/api/insights/groups', {
        by: 'department',
        currency: 'EUR',
      });

      expect(groups.map((g) => [g.key, g.currency, g.headcount, g.median])).toEqual([
        ['Engineering', 'EUR', 2, 7_500_000],
        ['Sales', 'EUR', 2, 6_000_000],
      ]);
    });

    it('groups by job title', async () => {
      const groups = await get<GroupStats[]>('/api/insights/groups', {
        by: 'jobTitle',
        currency: 'EUR',
      });

      expect(groups).toEqual([
        expect.objectContaining({ key: 'Software Engineer', headcount: 4, average: 6_750_000 }),
      ]);
    });

    it('builds distribution bands for a single currency', async () => {
      const distribution = await get<Distribution>('/api/insights/distribution', {
        currency: 'EUR',
        bands: 2,
      });

      expect(distribution.bands).toEqual([
        { from: 5_000_000, to: 7_000_000, count: 2 },
        { from: 7_000_000, to: 9_000_000, count: 2 },
      ]);
    });

    it('lists top and bottom earners for a currency', async () => {
      const earners = await get<Earners>('/api/insights/earners', { currency: 'EUR', limit: 2 });

      expect(earners.top.map((e) => e.salaryMinor)).toEqual([9_000_000, 7_000_000]);
      expect(earners.bottom.map((e) => e.salaryMinor)).toEqual([5_000_000, 6_000_000]);
    });
  });

  describe('validation', () => {
    it.each([
      ['/api/insights/groups', { by: 'department' }],
      ['/api/insights/groups', { by: 'salary', currency: 'USD' }],
      ['/api/insights/distribution', { currency: 'XYZ' }],
      ['/api/insights/distribution', { currency: 'USD', bands: 0 }],
      ['/api/insights/earners', { currency: 'USD', limit: 500 }],
    ])('rejects %s with %o', async (path, query) => {
      const response = await request(ctx.app).get(path).query(query);

      expect(response.status).toBe(400);
    });
  });
});
