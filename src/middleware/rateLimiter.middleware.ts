import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Global rate limiter - applies to all routes
 * Default: 100 requests per 15 minutes
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      'Too many requests. Please try again later.',
      429
    ).send(res);
  },
});

/**
 * Strict rate limiter for authentication routes
 * 10 requests per 15 minutes to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (_req, res) => {
    ApiResponse.error(
      'Too many authentication attempts. Please try again in 15 minutes.',
      429
    ).send(res);
  },
});

/**
 * Stricter rate limiter for password reset and sensitive operations
 * 3 requests per hour
 */
export const sensitiveRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many requests for this operation',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      'Too many requests for this operation. Please try again later.',
      429
    ).send(res);
  },
});
