import { Request, Response } from "express";
import { AuthRequest } from "../types/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middleware/index.js";
import { Review } from "../models/Review.model.js";
import { Order } from "../models/Order.model.js";
import { Product } from "../models/Product.model.js";
import { CreateReviewInput } from "../schemas/review.schema.js";

/**
 * GET /api/products/:id/reviews
 * Get all reviews for a product
 * @access Public
 */
export const getProductReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Verify product exists
    const product = await Product.findById(id);
    if (!product) {
      ApiResponse.notFound("Product not found").send(res);
      return;
    }

    const reviews = await Review.find({ product: id })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    ApiResponse.success(
      {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
      },
      "Reviews retrieved successfully"
    ).send(res);
  }
);

/**
 * POST /api/products/:id/reviews
 * Create a review for a product
 * @access Private
 */
export const createReview = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const { id: productId } = req.params;
    const { rating, comment } = req.body as CreateReviewInput;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      ApiResponse.notFound("Product not found").send(res);
      return;
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingReview) {
      ApiResponse.badRequest("You have already reviewed this product").send(
        res
      );
      return;
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      comment,
    });

    // Populate user info for response
    await review.populate("user", "name");

    ApiResponse.created({ review }, "Review created successfully").send(res);
  }
);

/**
 * GET /api/products/:id/can-review
 * Check if user can review a product
 * @access Private
 */
export const canReview = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const { id: productId } = req.params;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      ApiResponse.notFound("Product not found").send(res);
      return;
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.exists({
      user: req.user._id,
      "orderItems.product": productId,
      isPaid: true,
    });

    // Check if user has already reviewed this product
    const hasReviewed = await Review.exists({
      user: req.user._id,
      product: productId,
    });

    const canReview = !!hasPurchased && !hasReviewed;

    ApiResponse.success(
      {
        canReview,
        hasPurchased: !!hasPurchased,
        hasReviewed: !!hasReviewed,
      },
      "Review eligibility checked"
    ).send(res);
  }
);
