import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ConflictError, NotFoundError, ValidationError } from '../errors.js';
import type { Logger } from '../logger.js';

function isMalformedJson(error: unknown): boolean {
  return error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed';
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

function toAppError(error: unknown): AppError | undefined {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    return new ValidationError('Invalid request', details);
  }
  if (isMalformedJson(error)) return new ValidationError('Request body is not valid JSON');
  if (isUniqueViolation(error))
    return new ConflictError('A record with these details already exists');
  return undefined;
}

export const apiNotFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`No route for ${req.method} ${req.originalUrl}`));
};

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, req, res, _next) => {
    const appError = toAppError(error);
    if (appError) {
      res.status(appError.status).json({
        error: { code: appError.code, message: appError.message, details: appError.details },
      });
      return;
    }
    logger.error('Unhandled error', {
      method: req.method,
      path: req.originalUrl,
      error: error instanceof Error ? error.stack : String(error),
    });
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
  };
}
