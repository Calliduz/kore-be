import { Response } from 'express';

interface ApiResponseData<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  errors?: Array<{ field: string; message: string }>;
}

export class ApiResponse<T = unknown> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: T | null;
  public errors?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    data: T | null,
    message: string,
    errors?: Array<{ field: string; message: string }>
  ) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  /**
   * Send response to client
   */
  send(res: Response): Response {
    const response: ApiResponseData<T> = {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    };

    if (this.errors && this.errors.length > 0) {
      response.errors = this.errors;
    }

    return res.status(this.statusCode).json(response);
  }

  /**
   * Static factory for success responses
   */
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200
  ): ApiResponse<T> {
    return new ApiResponse(statusCode, data, message);
  }

  /**
   * Static factory for created responses
   */
  static created<T>(data: T, message = 'Created successfully'): ApiResponse<T> {
    return new ApiResponse(201, data, message);
  }

  /**
   * Static factory for error responses
   */
  static error(
    message: string,
    statusCode = 400,
    errors?: Array<{ field: string; message: string }>
  ): ApiResponse<null> {
    return new ApiResponse(statusCode, null, message, errors);
  }

  /**
   * Static factory for validation error responses
   */
  static validationError(
    errors: Array<{ field: string; message: string }>
  ): ApiResponse<null> {
    return new ApiResponse(400, null, 'Validation failed', errors);
  }

  /**
   * Static factory for unauthorized responses
   */
  static unauthorized(message = 'Unauthorized'): ApiResponse<null> {
    return new ApiResponse(401, null, message);
  }

  /**
   * Static factory for forbidden responses
   */
  static forbidden(message = 'Forbidden'): ApiResponse<null> {
    return new ApiResponse(403, null, message);
  }

  /**
   * Static factory for not found responses
   */
  static notFound(message = 'Resource not found'): ApiResponse<null> {
    return new ApiResponse(404, null, message);
  }

  /**
   * Static factory for internal server error responses
   */
  static serverError(message = 'Internal server error'): ApiResponse<null> {
    return new ApiResponse(500, null, message);
  }
}
