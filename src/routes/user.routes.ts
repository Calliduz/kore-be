import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  updateProfile,
  getAllUsers,
  getUserById,
  deleteUser,
} from '../controllers/user.controller.js';

const router = Router();

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', authenticate, authorize('admin'), getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/:id', authenticate, authorize('admin'), getUserById);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;
