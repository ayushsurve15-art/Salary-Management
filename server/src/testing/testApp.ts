import type { Express } from 'express';
import { createApp } from '../app.js';
import { IN_MEMORY, openDatabase, type Db } from '../db/connection.js';
import { runMigrations } from '../db/migrate.js';
import { createLogger } from '../logger.js';

export const TODAY = '2025-06-15';

export type TestContext = { app: Express; db: Db };

/** A fresh in-memory database and app whose clock is pinned to {@link TODAY}. */
export function createTestContext(): TestContext {
  const db = openDatabase(IN_MEMORY);
  runMigrations(db);
  const app = createApp({
    db,
    logger: createLogger(false),
    clock: () => new Date(`${TODAY}T12:00:00Z`),
  });
  return { app, db };
}

export function employeeInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    country: 'GB',
    currency: 'GBP',
    salaryMinor: 6_500_000,
    hireDate: '2020-01-06',
    ...overrides,
  };
}
