import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Db } from './connection.js';

// Resolves to server/migrations from both src/db and dist/db.
const DEFAULT_MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations', import.meta.url));

const MIGRATION_FILE = /^(\d+)_[\w-]+\.sql$/;

type Migration = { version: number; name: string; sql: string };

function readMigrations(dir: string): Migration[] {
  return readdirSync(dir)
    .flatMap((name) => {
      const match = MIGRATION_FILE.exec(name);
      return match
        ? [{ version: Number(match[1]), name, sql: readFileSync(`${dir}/${name}`, 'utf8') }]
        : [];
    })
    .sort((a, b) => a.version - b.version);
}

/** Applies pending migrations in order, each in its own transaction. Returns the names applied. */
export function runMigrations(db: Db, dir = DEFAULT_MIGRATIONS_DIR): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  ) STRICT`);

  const applied = new Set(
    db
      .prepare<[], { version: number }>('SELECT version FROM schema_migrations')
      .all()
      .map((row) => row.version),
  );
  const record = db.prepare(
    'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
  );

  const pending = readMigrations(dir).filter((migration) => !applied.has(migration.version));
  for (const migration of pending) {
    db.transaction(() => {
      db.exec(migration.sql);
      record.run(migration.version, migration.name, new Date().toISOString());
    })();
  }
  return pending.map((migration) => migration.name);
}
