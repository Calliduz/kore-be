import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Global error handler middleware
 * Catches all errors and returns consistent ApiResponse format
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error in development
  if (env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle ApiError instances
  if (err instanceof ApiError) {
    err.toResponse().send(res);
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const mongooseError = err as unknown as {
      errors: Record<string, { message: string }>;
    };
    const errors = Object.entries(mongooseError.errors).map(([field, error]) => ({
      field,
      message: error.message,
    }));
    ApiResponse.validationError(errors).send(res);
    return;
  }

  // Handle Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    const mongoError = err as unknown as { keyValue: Record<string, unknown> };
    const field = Object.keys(mongoError.keyValue)[0] || 'unknown';
    ApiResponse.error(`${field} already exists`, 409, [
      { field, message: `This ${field} is already in use` },
    ]).send(res);
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    ApiResponse.error('Invalid ID format', 400).send(res);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    ApiResponse.unauthorized('Invalid token').send(res);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    ApiResponse.unauthorized('Token expired').send(res);
    return;
  }

  // Default to 500 for unknown errors
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  ApiResponse.serverError(message).send(res);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  ApiResponse.notFound('Route not found').send(res);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
