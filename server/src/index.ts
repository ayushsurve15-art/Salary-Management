import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { createLogger } from './logger.js';

const config = loadConfig();
const logger = createLogger(config.env !== 'test');

const db = openDatabase(config.databasePath);
const applied = runMigrations(db);
if (applied.length > 0) {
  logger.info('Applied migrations', { migrations: applied });
}

const server = createApp({ db, logger }).listen(config.port, () => {
  logger.info('Server listening', { port: config.port, env: config.env });
});

function shutdown(signal: string): void {
  logger.info('Shutting down', { signal });
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
