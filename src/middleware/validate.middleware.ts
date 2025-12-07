import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Validation target - which part of the request to validate
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 * Returns granular field-level errors for frontend input highlighting
 */
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        ApiResponse.validationError(errors).send(res);
        return;
      }

      // Replace request data with parsed/transformed data
      req[target] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Format Zod errors into field-level errors for frontend
 * Each error includes the exact field name for input highlighting
 */
const formatZodErrors = (
  error: ZodError
): Array<{ field: string; message: string }> => {
  return error.errors.map((err) => {
    // Build field path (e.g., "address.city" or "items[0].name")
    const field = err.path
      .map((p, i) => {
        if (typeof p === 'number') {
          return `[${p}]`;
        }
        return i === 0 ? p : `.${p}`;
      })
      .join('');

    return {
      field: field || 'unknown',
      message: err.message,
    };
  });
};

/**
 * Validate multiple parts of the request
 */
export const validateMultiple = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const allErrors: Array<{ field: string; message: string }> = [];

    for (const [target, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const data = req[target as ValidationTarget];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = formatZodErrors(result.error).map((e) => ({
          ...e,
          field: target === 'body' ? e.field : `${target}.${e.field}`,
        }));
        allErrors.push(...errors);
      } else {
        req[target as ValidationTarget] = result.data;
      }
    }

    if (allErrors.length > 0) {
      ApiResponse.validationError(allErrors).send(res);
      return;
    }

    next();
  };
};
