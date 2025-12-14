import { Router } from "express";
import {
  authenticate,
  authorize,
  validateMultiple,
} from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createRefundRequest,
  getOrderRefund,
  getUserRefunds,
  getAllRefunds,
  updateRefundStatus,
} from "../controllers/refund.controller.js";
import {
  createRefundSchema,
  updateRefundStatusSchema,
  refundIdSchema,
  orderIdParamSchema,
} from "../schemas/refund.schema.js";

const router = Router();

// ============================================
// User Routes
// ============================================

/**
 * @route   GET /api/users/refunds
 * @desc    Get all user's refund requests
 * @access  Private
 */
router.get("/user", authenticate, getUserRefunds);

// ============================================
// Admin Routes
// ============================================

/**
 * @route   GET /api/admin/refunds
 * @desc    Get all refund requests
 * @access  Private/Admin
 */
router.get("/admin", authenticate, authorize("admin"), getAllRefunds);

/**
 * @route   PUT /api/admin/refunds/:id
 * @desc    Update refund status
 * @access  Private/Admin
 */
router.put(
  "/admin/:id",
  authenticate,
  authorize("admin"),
  validateMultiple({ params: refundIdSchema, body: updateRefundStatusSchema }),
  updateRefundStatus
);

// ============================================
// Order-specific Routes (nested under orders)
// ============================================

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Request refund for an order
 * @access  Private
 */
router.post(
  "/order/:id",
  authenticate,
  validateMultiple({ params: orderIdParamSchema, body: createRefundSchema }),
  createRefundRequest
);

/**
 * @route   GET /api/orders/:id/refund
 * @desc    Get refund status for an order
 * @access  Private
 */
router.get(
  "/order/:id",
  authenticate,
  validate(orderIdParamSchema, "params"),
  getOrderRefund
);

export default router;
