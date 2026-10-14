import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { IN_MEMORY, openDatabase } from '../db/connection.js';
import { runMigrations } from '../db/migrate.js';
import { createLogger } from '../logger.js';

describe('serving the built client', () => {
  let distPath: string;
  const db = openDatabase(IN_MEMORY);
  runMigrations(db);

  beforeAll(() => {
    distPath = mkdtempSync(join(tmpdir(), 'client-dist-'));
    mkdirSync(join(distPath, 'assets'));
    writeFileSync(join(distPath, 'index.html'), '<div id="root"></div>');
    writeFileSync(join(distPath, 'assets', 'app.js'), 'console.info("app")');
  });

  afterAll(() => {
    db.close();
    rmSync(distPath, { recursive: true, force: true });
  });

  const app = () => createApp({ db, logger: createLogger(false), clientDistPath: distPath });

  it('serves static assets', async () => {
    const response = await request(app()).get('/assets/app.js');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/javascript/);
  });

  it('falls back to index.html for client-side routes', async () => {
    const response = await request(app()).get('/employees/42');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<div id="root">');
  });

  it('keeps unknown API routes as JSON 404s', async () => {
    const response = await request(app()).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });
});
