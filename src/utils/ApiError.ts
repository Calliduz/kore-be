import { ApiResponse } from './ApiResponse.js';

export class ApiError extends Error {
  public statusCode: number;
  public errors?: Array<{ field: string; message: string }>;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors?: Array<{ field: string; message: string }>,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to ApiResponse for sending to client
   */
  toResponse(): ApiResponse<null> {
    return new ApiResponse(this.statusCode, null, this.message, this.errors);
  }

  /**
   * Bad Request (400)
   */
  static badRequest(
    message: string,
    errors?: Array<{ field: string; message: string }>
  ): ApiError {
    return new ApiError(400, message, errors);
  }

  /**
   * Unauthorized (401)
   */
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  /**
   * Forbidden (403)
   */
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  /**
   * Not Found (404)
   */
  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  /**
   * Conflict (409)
   */
  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  /**
   * Too Many Requests (429)
   */
  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  /**
   * Internal Server Error (500)
   */
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, undefined, false);
  }
}
