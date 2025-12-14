import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../types/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middleware/index.js";
import { User } from "../models/User.model.js";
import { AddPaymentMethodInput } from "../schemas/paymentMethod.schema.js";
import Stripe from "stripe";
import { env } from "../config/env.js";

// Initialize Stripe - use latest stable API version (same as payment.controller)
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/**
 * GET /api/users/payment-methods
 * Get user's saved payment methods
 * @access Private
 */
export const getPaymentMethods = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      ApiResponse.notFound("User not found").send(res);
      return;
    }

    ApiResponse.success(
      { paymentMethods: user.paymentMethods },
      "Payment methods retrieved successfully"
    ).send(res);
  }
);

/**
 * POST /api/users/payment-methods
 * Add payment method
 * @access Private
 */
export const addPaymentMethod = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const { stripePaymentMethodId } = req.body as AddPaymentMethodInput;

    const user = await User.findById(req.user._id);
    if (!user) {
      ApiResponse.notFound("User not found").send(res);
      return;
    }

    // Check if payment method already exists
    const exists = user.paymentMethods.some(
      (pm) => pm.stripePaymentMethodId === stripePaymentMethodId
    );
    if (exists) {
      ApiResponse.badRequest("Payment method already saved").send(res);
      return;
    }

    try {
      // Retrieve payment method details from Stripe
      const paymentMethod = await stripe.paymentMethods.retrieve(
        stripePaymentMethodId
      );

      if (!paymentMethod.card) {
        ApiResponse.badRequest("Invalid payment method type").send(res);
        return;
      }

      const newPaymentMethod = {
        _id: new mongoose.Types.ObjectId(),
        stripePaymentMethodId,
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expiryMonth: paymentMethod.card.exp_month,
        expiryYear: paymentMethod.card.exp_year,
        isDefault: user.paymentMethods.length === 0, // First one is default
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      user.paymentMethods.push(newPaymentMethod as any);
      await user.save();

      ApiResponse.created(
        { paymentMethod: user.paymentMethods[user.paymentMethods.length - 1] },
        "Payment method added successfully"
      ).send(res);
    } catch (error) {
      ApiResponse.badRequest(
        "Failed to retrieve payment method from Stripe"
      ).send(res);
    }
  }
);

/**
 * DELETE /api/users/payment-methods/:id
 * Remove payment method
 * @access Private
 */
export const deletePaymentMethod = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      ApiResponse.notFound("User not found").send(res);
      return;
    }

    const pmIndex = user.paymentMethods.findIndex(
      (pm) => pm._id.toString() === id
    );
    if (pmIndex === -1) {
      ApiResponse.notFound("Payment method not found").send(res);
      return;
    }

    const wasDefault = user.paymentMethods[pmIndex]!.isDefault;
    user.paymentMethods.splice(pmIndex, 1);

    // If deleted was default and there are others, make first one default
    if (wasDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[0]!.isDefault = true;
    }

    await user.save();

    ApiResponse.success(null, "Payment method removed successfully").send(res);
  }
);

/**
 * PUT /api/users/payment-methods/:id/default
 * Set payment method as default
 * @access Private
 */
export const setDefaultPaymentMethod = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      ApiResponse.notFound("User not found").send(res);
      return;
    }

    const pmIndex = user.paymentMethods.findIndex(
      (pm) => pm._id.toString() === id
    );
    if (pmIndex === -1) {
      ApiResponse.notFound("Payment method not found").send(res);
      return;
    }

    // Unset all defaults, then set the selected one
    user.paymentMethods.forEach((pm) => {
      pm.isDefault = false;
    });
    user.paymentMethods[pmIndex]!.isDefault = true;

    await user.save();

    ApiResponse.success(
      { paymentMethod: user.paymentMethods[pmIndex] },
      "Default payment method updated successfully"
    ).send(res);
  }
);
