import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IN_MEMORY, openDatabase, type Db } from '../db/connection.js';
import { runMigrations } from '../db/migrate.js';
import { seedDatabase } from './seedDatabase.js';

const options = { count: 300, seed: 11, referenceDate: '2025-06-30' };

describe('seedDatabase', () => {
  let db: Db;

  beforeEach(() => {
    db = openDatabase(IN_MEMORY);
    runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  const count = (table: string) =>
    db.prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count;

  it('inserts every employee and their salary history', () => {
    const result = seedDatabase(db, options);

    expect(result.employees).toBe(300);
    expect(count('employees')).toBe(300);
    expect(count('salary_history')).toBe(result.salaryHistoryEntries);
  });

  it('replaces existing data when run again instead of duplicating it', () => {
    seedDatabase(db, options);
    const firstRun = db.prepare('SELECT * FROM employees ORDER BY id').all();

    seedDatabase(db, options);

    expect(count('employees')).toBe(300);
    expect(db.prepare('SELECT * FROM employees ORDER BY id').all()).toEqual(firstRun);
  });
});
