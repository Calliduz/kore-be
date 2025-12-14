import { Router } from "express";
import {
  authenticate,
  authorize,
  validateMultiple,
} from "../middleware/index.js";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/coupon.controller.js";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  couponIdSchema,
} from "../schemas/coupon.schema.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

/**
 * @route   POST /api/coupons/validate
 * @desc    Validate a coupon code
 * @access  Public
 */
router.post("/validate", validate(validateCouponSchema), validateCoupon);

/**
 * @route   GET /api/coupons
 * @desc    Get all coupons
 * @access  Private/Admin
 */
router.get("/", authenticate, authorize("admin"), getAllCoupons);

/**
 * @route   POST /api/coupons
 * @desc    Create a new coupon
 * @access  Private/Admin
 */
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createCouponSchema),
  createCoupon
);

/**
 * @route   PUT /api/coupons/:id
 * @desc    Update a coupon
 * @access  Private/Admin
 */
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateMultiple({ params: couponIdSchema, body: updateCouponSchema }),
  updateCoupon
);

/**
 * @route   DELETE /api/coupons/:id
 * @desc    Delete a coupon
 * @access  Private/Admin
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(couponIdSchema, "params"),
  deleteCoupon
);

export default router;
