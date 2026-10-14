import { Router } from 'express';
import type { InsightsController } from '../controllers/insightsController.js';

export function insightsRoutes(controller: InsightsController): Router {
  return Router()
    .get('/insights/countries', controller.countries)
    .get('/insights/groups', controller.groups)
    .get('/insights/distribution', controller.distribution)
    .get('/insights/earners', controller.earners);
}
