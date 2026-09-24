import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database constraint error';
    details = (err as unknown as { code: string }).code;
  } else if (err.message) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error(
      {
        statusCode,
        message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
      },
      'Unhandled Server Error'
    );
  } else {
    logger.warn(
      {
        statusCode,
        message,
        url: req.originalUrl,
        method: req.method,
      },
      'Client Request Error'
    );
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details !== undefined && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
