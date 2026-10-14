import type { RequestHandler } from 'express';
import type { InsightsService } from '../services/insightsService.js';
import {
  distributionQuerySchema,
  earnersQuerySchema,
  groupInsightsQuerySchema,
} from '../validation/insightsSchemas.js';

export type InsightsController = Record<
  'countries' | 'groups' | 'distribution' | 'earners',
  RequestHandler
>;

export function createInsightsController(service: InsightsService): InsightsController {
  return {
    countries: (_req, res) => {
      res.json(service.byCountry());
    },
    groups: (req, res) => {
      const { by, currency } = groupInsightsQuerySchema.parse(req.query);
      res.json(service.byGroup(by, currency));
    },
    distribution: (req, res) => {
      const { currency, bands } = distributionQuerySchema.parse(req.query);
      res.json(service.distribution(currency, bands));
    },
    earners: (req, res) => {
      const { currency, limit } = earnersQuerySchema.parse(req.query);
      res.json(service.earners(currency, limit));
    },
  };
}
