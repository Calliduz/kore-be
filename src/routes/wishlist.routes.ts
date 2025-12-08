import { Router } from 'express';
import { authenticate } from '../middleware/index.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller.js';

const router = Router();

/**
 * @route   GET /api/wishlist
 * @desc    Get user's wishlist
 * @access  Private
 */
router.get('/', authenticate, getWishlist);

/**
 * @route   POST /api/wishlist/:productId
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post('/:productId', authenticate, addToWishlist);

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete('/:productId', authenticate, removeFromWishlist);

export default router;
