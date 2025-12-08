import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middleware/index.js';
import { User } from '../models/User.model.js';

/**
 * PUT /api/users/profile
 * Update user profile (name and/or password)
 * @access Private
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    ApiResponse.notFound('User not found').send(res);
    return;
  }

  const { name, password } = req.body as { name?: string; password?: string };

  // Update name if provided
  if (name && name.trim().length >= 2) {
    user.name = name.trim();
  }

  // Update password if provided
  if (password && password.length >= 8) {
    user.password = password; // Pre-save hook will hash it
  }

  const updatedUser = await user.save();

  ApiResponse.success(
    {
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    },
    'Profile updated successfully'
  ).send(res);
});

/**
 * GET /api/users
 * Get all users (admin only)
 * @access Private/Admin
 */
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });

  ApiResponse.success({ users }, 'Users retrieved successfully').send(res);
});

/**
 * GET /api/users/:id
 * Get user by ID (admin only)
 * @access Private/Admin
 */
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    ApiResponse.notFound('User not found').send(res);
    return;
  }

  ApiResponse.success({ user }, 'User retrieved successfully').send(res);
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 * @access Private/Admin
 */
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    ApiResponse.notFound('User not found').send(res);
    return;
  }

  if (user.role === 'admin') {
    ApiResponse.badRequest('Cannot delete admin user').send(res);
    return;
  }

  await User.findByIdAndDelete(req.params.id);

  ApiResponse.success(null, 'User deleted successfully').send(res);
});
