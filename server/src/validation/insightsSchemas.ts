import { z } from 'zod';
import { currencySchema } from './employeeSchemas.js';

const boundedInt = (min: number, max: number, fallback: number) =>
  z.coerce.number().int().min(min).max(max).default(fallback);

export const groupInsightsQuerySchema = z.object({
  by: z.enum(['department', 'jobTitle']),
  currency: currencySchema,
});

export const distributionQuerySchema = z.object({
  currency: currencySchema,
  bands: boundedInt(1, 50, 10),
});

export const earnersQuerySchema = z.object({
  currency: currencySchema,
  limit: boundedInt(1, 50, 5),
});
