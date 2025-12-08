import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middleware/index.js';
import { Wishlist } from '../models/Wishlist.model.js';
import { Product } from '../models/Product.model.js';

/**
 * GET /api/wishlist
 * Get user's wishlist with populated products
 * @access Private
 */
export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    match: { isActive: true },
    select: 'name description price images category stock',
  });

  // Create empty wishlist if doesn't exist
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  ApiResponse.success(
    { wishlist: wishlist.products },
    'Wishlist retrieved successfully'
  ).send(res);
});

/**
 * POST /api/wishlist/:productId
 * Add product to wishlist
 * @access Private
 */
export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  const { productId } = req.params;

  // Verify product exists and is active
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    ApiResponse.notFound('Product not found').send(res);
    return;
  }

  // Find or create wishlist
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  // Check if already in wishlist
  if (wishlist.products.some((p) => p.toString() === productId)) {
    ApiResponse.success(
      { wishlist: wishlist.products },
      'Product already in wishlist'
    ).send(res);
    return;
  }

  // Add product
  wishlist.products.push(product._id);
  await wishlist.save();

  // Return populated wishlist
  await wishlist.populate({
    path: 'products',
    match: { isActive: true },
    select: 'name description price images category stock',
  });

  ApiResponse.success(
    { wishlist: wishlist.products },
    'Product added to wishlist'
  ).send(res);
});

/**
 * DELETE /api/wishlist/:productId
 * Remove product from wishlist
 * @access Private
 */
export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    ApiResponse.notFound('Wishlist not found').send(res);
    return;
  }

  // Remove product from array
  wishlist.products = wishlist.products.filter(
    (p) => p.toString() !== productId
  );
  await wishlist.save();

  // Return populated wishlist
  await wishlist.populate({
    path: 'products',
    match: { isActive: true },
    select: 'name description price images category stock',
  });

  ApiResponse.success(
    { wishlist: wishlist.products },
    'Product removed from wishlist'
  ).send(res);
});
