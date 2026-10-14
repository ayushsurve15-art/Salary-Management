import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, ApiError, toQueryString } from './client';

function respondWith(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('toQueryString', () => {
  it('skips empty values', () => {
    expect(toQueryString({ page: 2, search: '', country: undefined, sort: 'name' })).toBe(
      '?page=2&sort=name',
    );
  });

  it('returns an empty string when nothing is set', () => {
    expect(toQueryString({ search: undefined })).toBe('');
  });
});

describe('apiRequest', () => {
  it('returns the parsed body on success', async () => {
    respondWith(200, { status: 'ok' });

    await expect(apiRequest('/health')).resolves.toEqual({ status: 'ok' });
  });

  it('turns the API error shape into an ApiError', async () => {
    respondWith(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: [{ path: 'salaryMinor', message: 'Must be greater than zero' }],
      },
    });

    const error = await apiRequest('/employees').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
    expect((error as ApiError).fieldErrors({ salaryMinor: 'salary' })).toEqual({
      salary: 'Must be greater than zero',
    });
  });

  it('still produces a readable error when the body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('Bad gateway', { status: 502 }))),
    );

    await expect(apiRequest('/employees')).rejects.toMatchObject({
      status: 502,
      message: 'Request failed with status 502',
    });
  });
});
