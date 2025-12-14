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

// ============================================
// User Refunds Router (mounted at /api/users/refunds)
// ============================================
export const userRefundsRouter = Router();

/**
 * @route   GET /api/users/refunds
 * @desc    Get all user's refund requests
 * @access  Private
 */
userRefundsRouter.get("/", authenticate, getUserRefunds);

// ============================================
// Admin Refunds Router (mounted at /api/admin/refunds)
// ============================================
export const adminRefundsRouter = Router();

/**
 * @route   GET /api/admin/refunds
 * @desc    Get all refund requests
 * @access  Private/Admin
 */
adminRefundsRouter.get("/", authenticate, authorize("admin"), getAllRefunds);

/**
 * @route   PUT /api/admin/refunds/:id
 * @desc    Update refund status
 * @access  Private/Admin
 */
adminRefundsRouter.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateMultiple({ params: refundIdSchema, body: updateRefundStatusSchema }),
  updateRefundStatus
);

// ============================================
// Order Refunds Router (mounted at /api/orders)
// ============================================
export const orderRefundsRouter = Router();

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Request refund for an order
 * @access  Private
 */
orderRefundsRouter.post(
  "/:id/refund",
  authenticate,
  validateMultiple({ params: orderIdParamSchema, body: createRefundSchema }),
  createRefundRequest
);

/**
 * @route   GET /api/orders/:id/refund
 * @desc    Get refund status for an order
 * @access  Private
 */
orderRefundsRouter.get(
  "/:id/refund",
  authenticate,
  validate(orderIdParamSchema, "params"),
  getOrderRefund
);

// Default export for backwards compatibility (not used)
const router = Router();
export default router;
