import express, { type Express } from 'express';
import { createEmployeeController } from './controllers/employeeController.js';
import { createHealthController } from './controllers/healthController.js';
import { createInsightsController } from './controllers/insightsController.js';
import type { Db } from './db/connection.js';
import { systemClock, type Clock } from './domain/dates.js';
import type { Logger } from './logger.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createEmployeeRepository } from './repositories/employeeRepository.js';
import { createHealthRepository } from './repositories/healthRepository.js';
import { createInsightsRepository } from './repositories/insightsRepository.js';
import { employeeRoutes } from './routes/employeeRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { insightsRoutes } from './routes/insightsRoutes.js';
import { createEmployeeService } from './services/employeeService.js';
import { createHealthService } from './services/healthService.js';
import { createInsightsService } from './services/insightsService.js';

export type AppDependencies = { db: Db; logger: Logger; clock?: Clock };

export function createApp({ db, logger, clock = systemClock }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestLogger(logger));
  app.use(express.json({ limit: '100kb' }));

  const healthController = createHealthController(createHealthService(createHealthRepository(db)));
  const employeeController = createEmployeeController(
    createEmployeeService(createEmployeeRepository(db), clock),
  );
  const insightsController = createInsightsController(
    createInsightsService(createInsightsRepository(db)),
  );
  app.use('/api', healthRoutes(healthController));
  app.use('/api', employeeRoutes(employeeController));
  app.use('/api', insightsRoutes(insightsController));

  app.use('/api', apiNotFound);
  app.use(errorHandler(logger));
  return app;
}
