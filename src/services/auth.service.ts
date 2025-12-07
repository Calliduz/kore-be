import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeAllUserTokens,
} from './token.service.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenFamily: string;
}

export interface UserData {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResult {
  user: UserData;
  tokens: AuthTokens;
}

/**
 * Register a new user
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const { email, password, name } = input;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  // Create user
  const user = await User.create({
    email,
    password,
    name,
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const { token: refreshToken, family: tokenFamily } = await createRefreshToken(
    user._id.toString(),
    user.email,
    user.role
  );

  const userData: UserData = {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    user: userData,
    tokens: { accessToken, refreshToken, tokenFamily },
  };
};

/**
 * Login user with email and password
 */
export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const { email, password } = input;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked) {
    const lockUntil = user.lockUntil ? new Date(user.lockUntil) : new Date();
    const minutesLeft = Math.ceil((lockUntil.getTime() - Date.now()) / 60000);
    throw ApiError.forbidden(
      `Account is locked. Please try again in ${minutesLeft} minutes.`
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Increment failed attempts
    await user.incrementLoginAttempts();
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Reset failed login attempts on successful login
  if (user.failedLoginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const { token: refreshToken, family: tokenFamily } = await createRefreshToken(
    user._id.toString(),
    user.email,
    user.role
  );

  const userData: UserData = {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    user: userData,
    tokens: { accessToken, refreshToken, tokenFamily },
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<AuthTokens | null> => {
  const result = await rotateRefreshToken(refreshToken);

  if (!result) {
    return null;
  }

  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    tokenFamily: result.family,
  };
};

/**
 * Logout user - revoke all refresh tokens
 */
export const logoutUser = async (userId: string): Promise<void> => {
  await revokeAllUserTokens(userId);
};

/**
 * Get user by ID
 */
export const getUserById = async (
  userId: string
): Promise<UserData | null> => {
  const user = await User.findById(userId);
  if (!user) return null;
  
  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
