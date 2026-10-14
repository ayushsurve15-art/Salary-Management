import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { IN_MEMORY, openDatabase, type Db } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { createLogger } from './logger.js';

describe('app', () => {
  let db: Db;

  beforeEach(() => {
    db = openDatabase(IN_MEMORY);
    runMigrations(db);
  });

  afterEach(() => {
    if (db.open) db.close();
  });

  const app = () => createApp({ db, logger: createLogger(false) });

  it('reports healthy when the database answers', async () => {
    const response = await request(app()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'ok' });
  });

  it('reports unavailable when the database is closed', async () => {
    const server = app();
    db.close();

    const response = await request(server).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'unavailable', database: 'unavailable' });
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const response = await request(app()).get('/api/nope');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'No route for GET /api/nope' },
    });
  });

  it('rejects a malformed JSON body with a validation error', async () => {
    const response = await request(app())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });
});
