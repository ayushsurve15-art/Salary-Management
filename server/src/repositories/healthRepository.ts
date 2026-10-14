import type { Db } from '../db/connection.js';

export type HealthRepository = { ping: () => void };

export function createHealthRepository(db: Db): HealthRepository {
  const select = db.prepare('SELECT 1');
  return {
    ping: () => {
      select.get();
    },
  };
}
