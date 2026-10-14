import { loadConfig } from '../config.js';
import { openDatabase } from '../db/connection.js';
import { runMigrations } from '../db/migrate.js';
import { createLogger } from '../logger.js';
import { seedDatabase } from './seedDatabase.js';

const config = loadConfig();
const logger = createLogger();
const db = openDatabase(config.databasePath);

try {
  runMigrations(db);
  const startedAt = performance.now();
  const result = seedDatabase(db);
  logger.info('Seeded database', {
    ...result,
    databasePath: config.databasePath,
    durationMs: Math.round(performance.now() - startedAt),
  });
} finally {
  db.close();
}
