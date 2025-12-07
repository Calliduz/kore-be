import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthRequest } from '../types/index.js';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Authentication middleware
 * Verifies JWT from httpOnly cookie and attaches user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from httpOnly cookie
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      ApiResponse.unauthorized('Access token not found').send(res);
      return;
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        ApiResponse.unauthorized('Access token expired').send(res);
        return;
      }
      ApiResponse.unauthorized('Invalid access token').send(res);
      return;
    }

    // Find user
    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      ApiResponse.unauthorized('User not found').send(res);
      return;
    }

    // Check if account is locked
    if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
      ApiResponse.forbidden('Account is temporarily locked').send(res);
      return;
    }

    // Attach user to request
    req.user = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      failedLoginAttempts: user.failedLoginAttempts,
      lockUntil: user.lockUntil,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if valid token exists, but doesn't require it
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return next();
    }

    try {
      const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as JwtPayload;
      const user = await User.findById(decoded.userId).lean();

      if (user && (!user.lockUntil || new Date(user.lockUntil).getTime() <= Date.now())) {
        req.user = {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          failedLoginAttempts: user.failedLoginAttempts,
          lockUntil: user.lockUntil,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }
    } catch {
      // Token invalid or expired, continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.unauthorized('Authentication required').send(res);
      return;
    }

    if (!roles.includes(req.user.role)) {
      ApiResponse.forbidden('Insufficient permissions').send(res);
      return;
    }

    next();
  };
};
