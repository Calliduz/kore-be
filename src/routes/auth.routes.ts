import { Router } from 'express';
import { register, login, refresh, logout, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  register
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  login
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token cookie
 */
router.post('/refresh', authRateLimiter, refresh);

/**
 * POST /api/auth/logout
 * Logout and clear cookies
 */
router.post('/logout', authenticate, logout);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, getMe);

export default router;
