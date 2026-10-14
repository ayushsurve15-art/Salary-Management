import type { Db } from '../db/connection.js';
import { createSeedRepository } from '../repositories/seedRepository.js';
import { generateEmployees, type GenerateOptions } from './generateEmployees.js';

export const DEFAULT_SEED_OPTIONS: GenerateOptions = {
  count: 10_000,
  seed: 20_250_630,
  referenceDate: '2025-06-30',
};

export type SeedResult = { employees: number; salaryHistoryEntries: number };

/** Wipes and reseeds the database. Deterministic, including timestamps, for a given options set. */
export function seedDatabase(db: Db, options: GenerateOptions = DEFAULT_SEED_OPTIONS): SeedResult {
  const employees = generateEmployees(options);
  createSeedRepository(db).replaceAll(employees, `${options.referenceDate}T00:00:00.000Z`);
  return {
    employees: employees.length,
    salaryHistoryEntries: employees.reduce((sum, employee) => sum + employee.history.length, 0),
  };
}
