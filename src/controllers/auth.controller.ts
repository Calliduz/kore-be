import { Response } from 'express';
import { env } from '../config/env.js';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middleware/index.js';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from '../services/auth.service.js';
import { RegisterInput, LoginInput } from '../schemas/index.js';

/**
 * Cookie options for secure token storage
 */
const getAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
});

const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth', // Only sent to auth routes
});

/**
 * Set authentication cookies on response
 */
const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
};

/**
 * Clear authentication cookies
 */
const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth' });
};

/**
 * POST /api/auth/register
 * Register a new user
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const input = req.body as RegisterInput;

  const { user, tokens } = await registerUser(input);

  // Set httpOnly cookies
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  ApiResponse.created(
    {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    'Registration successful'
  ).send(res);
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const input = req.body as LoginInput;

  const { user, tokens } = await loginUser(input);

  // Set httpOnly cookies
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  ApiResponse.success(
    {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    'Login successful'
  ).send(res);
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    clearAuthCookies(res);
    ApiResponse.unauthorized('Refresh token not found').send(res);
    return;
  }

  const tokens = await refreshAccessToken(refreshToken);

  if (!tokens) {
    clearAuthCookies(res);
    ApiResponse.unauthorized('Invalid or expired refresh token').send(res);
    return;
  }

  // Set new httpOnly cookies (rotation)
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  ApiResponse.success(null, 'Token refreshed successfully').send(res);
});

/**
 * POST /api/auth/logout
 * Logout and revoke all tokens
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user) {
    await logoutUser(req.user._id);
  }

  clearAuthCookies(res);

  ApiResponse.success(null, 'Logout successful').send(res);
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  ApiResponse.success(
    {
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    },
    'User profile retrieved'
  ).send(res);
});
