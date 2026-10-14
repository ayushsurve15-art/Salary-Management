import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { createLogger } from './logger.js';
import { seedIfEmpty } from './seed/seedDatabase.js';

// Resolves to client/dist from both server/src and server/dist.
const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url));

const config = loadConfig();
const logger = createLogger(config.env !== 'test');

const db = openDatabase(config.databasePath);
const applied = runMigrations(db);
if (applied.length > 0) {
  logger.info('Applied migrations', { migrations: applied });
}

if (config.seedOnEmpty) {
  const seeded = seedIfEmpty(db);
  if (seeded) logger.info('Seeded empty database', { ...seeded });
}

const clientDistPath = existsSync(CLIENT_DIST) ? CLIENT_DIST : undefined;
const server = createApp({ db, logger, ...(clientDistPath && { clientDistPath }) }).listen(
  config.port,
  () => {
    logger.info('Server listening', {
      port: config.port,
      env: config.env,
      servingClient: clientDistPath !== undefined,
    });
  },
);

function shutdown(signal: string): void {
  logger.info('Shutting down', { signal });
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
