import { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middleware/index.js";
import { RefundRequest } from "../models/RefundRequest.model.js";
import { Order } from "../models/Order.model.js";
import {
  CreateRefundInput,
  UpdateRefundStatusInput,
} from "../schemas/refund.schema.js";

/**
 * POST /api/orders/:id/refund
 * Request refund for an order
 * @access Private
 */
export const createRefundRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const orderId = req.params.id;
    const { reason, description, items } = req.body as CreateRefundInput;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      ApiResponse.notFound("Order not found").send(res);
      return;
    }

    // Verify order belongs to user
    if (order.user.toString() !== req.user._id) {
      ApiResponse.forbidden(
        "Not authorized to request refund for this order"
      ).send(res);
      return;
    }

    // Check if order is paid
    if (!order.isPaid) {
      ApiResponse.badRequest("Cannot request refund for unpaid order").send(
        res
      );
      return;
    }

    // Check if refund request already exists
    const existingRefund = await RefundRequest.findOne({ order: orderId });
    if (existingRefund) {
      ApiResponse.badRequest(
        "Refund request already exists for this order"
      ).send(res);
      return;
    }

    // Validate items exist in order and calculate refund amounts
    const refundItems = [];
    let totalRefundAmount = 0;

    for (const item of items) {
      const orderItem = order.orderItems.find(
        (oi) => oi.product.toString() === item.product
      );
      if (!orderItem) {
        ApiResponse.badRequest(
          `Product ${item.product} not found in order`
        ).send(res);
        return;
      }
      if (item.qty > orderItem.qty) {
        ApiResponse.badRequest(
          `Requested quantity exceeds ordered quantity for ${orderItem.name}`
        ).send(res);
        return;
      }

      const refundAmount = orderItem.price * item.qty;
      refundItems.push({
        product: orderItem.product,
        qty: item.qty,
        refundAmount,
      });
      totalRefundAmount += refundAmount;
    }

    // Create refund request
    const refund = await RefundRequest.create({
      order: orderId,
      user: req.user._id,
      reason,
      description,
      items: refundItems,
      totalRefundAmount,
    });

    ApiResponse.created(
      { refund },
      "Refund request submitted successfully"
    ).send(res);
  }
);

/**
 * GET /api/orders/:id/refund
 * Get refund status for an order
 * @access Private
 */
export const getOrderRefund = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const orderId = req.params.id;

    // Find the order first to verify ownership
    const order = await Order.findById(orderId);
    if (!order) {
      ApiResponse.notFound("Order not found").send(res);
      return;
    }

    // Verify order belongs to user (or user is admin)
    if (order.user.toString() !== req.user._id && req.user.role !== "admin") {
      ApiResponse.forbidden("Not authorized").send(res);
      return;
    }

    const refund = await RefundRequest.findOne({ order: orderId });
    if (!refund) {
      ApiResponse.notFound("No refund request found for this order").send(res);
      return;
    }

    ApiResponse.success(
      { refund },
      "Refund request retrieved successfully"
    ).send(res);
  }
);

/**
 * GET /api/users/refunds
 * Get all user's refund requests
 * @access Private
 */
export const getUserRefunds = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const refunds = await RefundRequest.find({ user: req.user._id })
      .populate("order", "totalPrice createdAt")
      .sort({ createdAt: -1 });

    ApiResponse.success(
      { refunds },
      "Refund requests retrieved successfully"
    ).send(res);
  }
);

/**
 * GET /api/admin/refunds
 * Get all refund requests (admin)
 * @access Admin
 */
export const getAllRefunds = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const refunds = await RefundRequest.find({})
      .populate("order", "totalPrice createdAt")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    ApiResponse.success(
      { refunds },
      "All refund requests retrieved successfully"
    ).send(res);
  }
);

/**
 * PUT /api/admin/refunds/:id
 * Update refund status (admin)
 * @access Admin
 */
export const updateRefundStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body as UpdateRefundStatusInput;

    const refund = await RefundRequest.findById(id);
    if (!refund) {
      ApiResponse.notFound("Refund request not found").send(res);
      return;
    }

    // Can only update from pending status
    if (refund.status !== "pending" && status !== "processed") {
      ApiResponse.badRequest(`Cannot change status from ${refund.status}`).send(
        res
      );
      return;
    }

    refund.status = status;
    if (adminNotes) {
      refund.adminNotes = adminNotes;
    }
    if (status === "processed") {
      refund.processedAt = new Date();
    }

    await refund.save();

    ApiResponse.success({ refund }, `Refund request ${status}`).send(res);
  }
);
