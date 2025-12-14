import { Router } from "express";
import { authenticate, validateMultiple } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getProductReviews,
  createReview,
  canReview,
} from "../controllers/review.controller.js";
import {
  createReviewSchema,
  productIdSchema,
} from "../schemas/review.schema.js";

const router = Router({ mergeParams: true }); // mergeParams to access :id from parent route

/**
 * @route   GET /api/products/:id/reviews
 * @desc    Get all reviews for a product
 * @access  Public
 */
router.get("/", validate(productIdSchema, "params"), getProductReviews);

/**
 * @route   POST /api/products/:id/reviews
 * @desc    Create a review for a product
 * @access  Private
 */
router.post(
  "/",
  authenticate,
  validateMultiple({ params: productIdSchema, body: createReviewSchema }),
  createReview
);

/**
 * @route   GET /api/products/:id/can-review
 * @desc    Check if user can review a product
 * @access  Private
 */
router.get(
  "/can-review",
  authenticate,
  validate(productIdSchema, "params"),
  canReview
);

export default router;
