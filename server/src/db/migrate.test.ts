import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IN_MEMORY, openDatabase, type Db } from './connection.js';
import { runMigrations } from './migrate.js';

describe('runMigrations', () => {
  let db: Db;

  beforeEach(() => {
    db = openDatabase(IN_MEMORY);
  });

  afterEach(() => {
    db.close();
  });

  it('creates the schema on an empty database', () => {
    expect(runMigrations(db)).toEqual(['001_initial.sql']);

    const tables = db
      .prepare<[], { name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name);
    expect(tables).toEqual(expect.arrayContaining(['employees', 'salary_history']));
  });

  it('applies nothing when run a second time', () => {
    runMigrations(db);

    expect(runMigrations(db)).toEqual([]);
  });

  it('enforces foreign keys so history cannot point at a missing employee', () => {
    runMigrations(db);
    const insertOrphan = db.prepare(
      `INSERT INTO salary_history (employee_id, salary_minor, currency, effective_date, reason, created_at)
       VALUES (999, 100, 'USD', '2024-01-01', 'Orphan', '2024-01-01T00:00:00Z')`,
    );

    expect(() => insertOrphan.run()).toThrow(/FOREIGN KEY/);
  });
});
