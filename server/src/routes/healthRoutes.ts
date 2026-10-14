import { Router } from 'express';
import type { HealthController } from '../controllers/healthController.js';

export function healthRoutes(controller: HealthController): Router {
  return Router().get('/health', controller.getHealth);
}
