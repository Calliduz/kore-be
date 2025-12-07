import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { RefreshToken } from '../models/RefreshToken.model.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate access token (short-lived, stored in httpOnly cookie)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Generate refresh token (longer-lived, stored in httpOnly cookie)
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Generate token family ID for rotation tracking
 */
export const generateTokenFamily = (): string => {
  return crypto.randomUUID();
};

/**
 * Parse expiry string to milliseconds
 */
const parseExpiry = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1] as string, 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
};

/**
 * Create and store refresh token with rotation support
 */
export const createRefreshToken = async (
  userId: string,
  email: string,
  role: string,
  family?: string
): Promise<{ token: string; family: string }> => {
  const tokenFamily = family || generateTokenFamily();
  const token = generateRefreshToken({ userId, email, role });

  const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRES_IN));

  await RefreshToken.create({
    userId: new mongoose.Types.ObjectId(userId),
    token,
    family: tokenFamily,
    expiresAt,
  });

  return { token, family: tokenFamily };
};

/**
 * Rotate refresh token
 * Returns new token and invalidates old one
 * Detects token reuse attacks by checking if token was already used
 */
export const rotateRefreshToken = async (
  oldToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  family: string;
} | null> => {
  // Find the refresh token
  const storedToken = await RefreshToken.findOne({ token: oldToken });

  if (!storedToken) {
    return null;
  }

  // Check if token was already revoked (reuse detection)
  if (storedToken.isRevoked) {
    // Security: Revoke entire token family
    await RefreshToken.updateMany(
      { family: storedToken.family },
      { $set: { isRevoked: true } }
    );
    console.warn(`⚠️ Token reuse detected for family: ${storedToken.family}`);
    return null;
  }

  // Check if expired
  if (storedToken.expiresAt < new Date()) {
    await storedToken.updateOne({ isRevoked: true });
    return null;
  }

  // Verify the token is valid
  const payload = verifyRefreshToken(oldToken);
  if (!payload) {
    await storedToken.updateOne({ isRevoked: true });
    return null;
  }

  // Revoke old token
  await storedToken.updateOne({ isRevoked: true });

  // Create new tokens
  const accessToken = generateAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });

  const { token: refreshToken, family } = await createRefreshToken(
    payload.userId,
    payload.email,
    payload.role,
    storedToken.family // Keep same family for rotation tracking
  );

  return { accessToken, refreshToken, family };
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await RefreshToken.updateMany(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $set: { isRevoked: true } }
  );
};

/**
 * Revoke a specific token family
 */
export const revokeTokenFamily = async (family: string): Promise<void> => {
  await RefreshToken.updateMany(
    { family },
    { $set: { isRevoked: true } }
  );
};
