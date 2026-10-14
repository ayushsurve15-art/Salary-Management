import type { RequestHandler } from 'express';
import type { HealthService } from '../services/healthService.js';

export type HealthController = { getHealth: RequestHandler };

export function createHealthController(service: HealthService): HealthController {
  return {
    getHealth: (_req, res) => {
      const health = service.check();
      res.status(health.status === 'ok' ? 200 : 503).json(health);
    },
  };
}
