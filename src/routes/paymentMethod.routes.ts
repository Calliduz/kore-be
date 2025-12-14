import { Router } from "express";
import { authenticate } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from "../controllers/paymentMethod.controller.js";
import {
  addPaymentMethodSchema,
  paymentMethodIdSchema,
} from "../schemas/paymentMethod.schema.js";

const router = Router();

/**
 * @route   GET /api/users/payment-methods
 * @desc    Get user's saved payment methods
 * @access  Private
 */
router.get("/", authenticate, getPaymentMethods);

/**
 * @route   POST /api/users/payment-methods
 * @desc    Add payment method
 * @access  Private
 */
router.post(
  "/",
  authenticate,
  validate(addPaymentMethodSchema),
  addPaymentMethod
);

/**
 * @route   PUT /api/users/payment-methods/:id/default
 * @desc    Set payment method as default
 * @access  Private
 */
router.put(
  "/:id/default",
  authenticate,
  validate(paymentMethodIdSchema, "params"),
  setDefaultPaymentMethod
);

/**
 * @route   DELETE /api/users/payment-methods/:id
 * @desc    Remove payment method
 * @access  Private
 */
router.delete(
  "/:id",
  authenticate,
  validate(paymentMethodIdSchema, "params"),
  deletePaymentMethod
);

export default router;
