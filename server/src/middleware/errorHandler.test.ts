import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ConflictError, NotFoundError } from '../errors.js';
import type { Logger } from '../logger.js';
import { errorHandler } from './errorHandler.js';

function appThrowing(error: unknown, logger: Logger = silentLogger()) {
  const app = express();
  app.get('/boom', () => {
    throw error;
  });
  app.use(errorHandler(logger));
  return app;
}

function silentLogger(): Logger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe('errorHandler', () => {
  it('maps domain errors to their status and code', async () => {
    const notFound = await request(appThrowing(new NotFoundError('Employee 7 not found'))).get(
      '/boom',
    );
    const conflict = await request(appThrowing(new ConflictError('Stale version'))).get('/boom');

    expect(notFound.status).toBe(404);
    expect(notFound.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Employee 7 not found' },
    });
    expect(conflict.status).toBe(409);
    expect(conflict.body).toMatchObject({ error: { code: 'CONFLICT' } });
  });

  it('turns Zod errors into a 400 with one detail per field', async () => {
    const result = z.object({ email: z.email(), age: z.number() }).safeParse({ email: 'x' });

    const response = await request(appThrowing(result.error)).get('/boom');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: { code: 'VALIDATION_ERROR', details: [{ path: 'email' }, { path: 'age' }] },
    });
  });

  it('turns a SQLite unique violation into a 409', async () => {
    const unique = Object.assign(new Error('UNIQUE constraint failed'), {
      code: 'SQLITE_CONSTRAINT_UNIQUE',
    });

    const response = await request(appThrowing(unique)).get('/boom');

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ error: { code: 'CONFLICT' } });
  });

  it('hides unexpected errors behind a generic 500 and logs them', async () => {
    const logger = silentLogger();

    const response = await request(appThrowing(new Error('secret detail'), logger)).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
