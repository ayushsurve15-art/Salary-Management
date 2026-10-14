import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('falls back to defaults when nothing is set', () => {
    expect(loadConfig({})).toEqual({
      env: 'development',
      port: 4000,
      databasePath: 'data/salary.db',
    });
  });

  it('reads and coerces values from the environment', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      DATABASE_PATH: '/data/app.db',
    });

    expect(config).toEqual({ env: 'production', port: 8080, databasePath: '/data/app.db' });
  });

  it('rejects an invalid port with a readable message', () => {
    expect(() => loadConfig({ PORT: 'eighty' })).toThrow(/Invalid environment configuration: PORT/);
  });

  it('rejects an unknown environment name', () => {
    expect(() => loadConfig({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
