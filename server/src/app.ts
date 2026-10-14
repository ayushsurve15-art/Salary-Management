import express, { type Express } from 'express';
import { createHealthController } from './controllers/healthController.js';
import type { Db } from './db/connection.js';
import type { Logger } from './logger.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createHealthRepository } from './repositories/healthRepository.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { createHealthService } from './services/healthService.js';

export type AppDependencies = { db: Db; logger: Logger };

export function createApp({ db, logger }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestLogger(logger));
  app.use(express.json({ limit: '100kb' }));

  const healthController = createHealthController(createHealthService(createHealthRepository(db)));
  app.use('/api', healthRoutes(healthController));

  app.use('/api', apiNotFound);
  app.use(errorHandler(logger));
  return app;
}
