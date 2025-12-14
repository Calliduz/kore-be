import { Request, Response } from "express";
import { AuthRequest } from "../types/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middleware/index.js";
import { Coupon } from "../models/Coupon.model.js";
import {
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
} from "../schemas/coupon.schema.js";

/**
 * GET /api/coupons
 * Get all coupons (admin only)
 * @access Private/Admin
 */
export const getAllCoupons = asyncHandler(
  async (_req: Request, res: Response) => {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });

    ApiResponse.success({ coupons }, "Coupons retrieved successfully").send(
      res
    );
  }
);

/**
 * POST /api/coupons
 * Create a new coupon (admin only)
 * @access Private/Admin
 */
export const createCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as CreateCouponInput;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({
      code: input.code.toUpperCase(),
    });
    if (existingCoupon) {
      ApiResponse.badRequest("Coupon code already exists").send(res);
      return;
    }

    const coupon = await Coupon.create(input);

    ApiResponse.created({ coupon }, "Coupon created successfully").send(res);
  }
);

/**
 * PUT /api/coupons/:id
 * Update a coupon (admin only)
 * @access Private/Admin
 */
export const updateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const input = req.body as UpdateCouponInput;

    // If updating code, check for duplicates
    if (input.code) {
      const existingCoupon = await Coupon.findOne({
        code: input.code.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingCoupon) {
        ApiResponse.badRequest("Coupon code already exists").send(res);
        return;
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      ApiResponse.notFound("Coupon not found").send(res);
      return;
    }

    ApiResponse.success({ coupon }, "Coupon updated successfully").send(res);
  }
);

/**
 * DELETE /api/coupons/:id
 * Delete a coupon (admin only)
 * @access Private/Admin
 */
export const deleteCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      ApiResponse.notFound("Coupon not found").send(res);
      return;
    }

    ApiResponse.success(null, "Coupon deleted successfully").send(res);
  }
);

/**
 * POST /api/coupons/validate
 * Validate a coupon code (public)
 * @access Public
 */
export const validateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, cartTotal } = req.body as ValidateCouponInput;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      ApiResponse.success(
        { valid: false, message: "Coupon not found" },
        "Coupon validation result"
      ).send(res);
      return;
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      ApiResponse.success(
        { valid: false, message: "Coupon is not active" },
        "Coupon validation result"
      ).send(res);
      return;
    }

    // Check if coupon has expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      ApiResponse.success(
        { valid: false, message: "Coupon has expired" },
        "Coupon validation result"
      ).send(res);
      return;
    }

    // Check if coupon has reached max uses
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      ApiResponse.success(
        { valid: false, message: "Coupon has reached maximum uses" },
        "Coupon validation result"
      ).send(res);
      return;
    }

    // Check minimum purchase requirement
    if (cartTotal < coupon.minPurchase) {
      ApiResponse.success(
        {
          valid: false,
          message: `Minimum purchase amount of $${coupon.minPurchase} required`,
        },
        "Coupon validation result"
      ).send(res);
      return;
    }

    // Calculate discount amount
    let discountAmount: number;
    if (coupon.discountType === "percentage") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
    } else {
      discountAmount = Math.min(coupon.discountValue, cartTotal);
    }

    ApiResponse.success(
      {
        valid: true,
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minPurchase: coupon.minPurchase,
        },
        discountAmount,
        message: "Coupon applied successfully",
      },
      "Coupon validation result"
    ).send(res);
  }
);
