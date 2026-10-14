import type { HealthRepository } from '../repositories/healthRepository.js';

export type HealthStatus = { status: 'ok' | 'unavailable'; database: 'ok' | 'unavailable' };

export type HealthService = { check: () => HealthStatus };

export function createHealthService(repository: HealthRepository): HealthService {
  return {
    check: () => {
      try {
        repository.ping();
        return { status: 'ok', database: 'ok' };
      } catch {
        return { status: 'unavailable', database: 'unavailable' };
      }
    },
  };
}
