import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middleware/index.js';
import { Order } from '../models/Order.model.js';
import { Product } from '../models/Product.model.js';
import { CreateOrderInput, UpdatePaymentInput } from '../schemas/order.schema.js';

/**
 * POST /api/orders
 * Create a new order
 * @access Private
 */
export const addOrderItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body as CreateOrderInput;

  if (!orderItems || orderItems.length === 0) {
    ApiResponse.badRequest('No order items provided').send(res);
    return;
  }

  // Validate stock for all items
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      ApiResponse.badRequest(`Product not found: ${item.name}`).send(res);
      return;
    }

    if (!product.isActive) {
      ApiResponse.badRequest(`Product is not available: ${item.name}`).send(res);
      return;
    }

    if (product.stock < item.qty) {
      ApiResponse.badRequest(
        `Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.qty}`
      ).send(res);
      return;
    }
  }

  // Decrement stock for each item
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.qty },
    });
  }

  // Create order
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  ApiResponse.created(
    { order },
    'Order created successfully'
  ).send(res);
});

/**
 * GET /api/orders/:id
 * Get order by ID
 * @access Private
 */
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    ApiResponse.notFound('Order not found').send(res);
    return;
  }

  // Only allow owner or admin to view order
  if (order.user._id.toString() !== req.user._id && req.user.role !== 'admin') {
    ApiResponse.forbidden('Not authorized to view this order').send(res);
    return;
  }

  ApiResponse.success({ order }, 'Order retrieved successfully').send(res);
});

/**
 * PUT /api/orders/:id/pay
 * Update order to paid
 * @access Private
 */
export const updateOrderToPaid = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    ApiResponse.notFound('Order not found').send(res);
    return;
  }

  // Only allow owner or admin to update payment
  if (order.user.toString() !== req.user._id && req.user.role !== 'admin') {
    ApiResponse.forbidden('Not authorized to update this order').send(res);
    return;
  }

  const paymentResult = req.body as UpdatePaymentInput;

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = {
    id: paymentResult.id,
    status: paymentResult.status,
    update_time: paymentResult.update_time,
    email_address: paymentResult.email_address,
  };

  const updatedOrder = await order.save();

  ApiResponse.success(
    { order: updatedOrder },
    'Order marked as paid'
  ).send(res);
});

/**
 * PUT /api/orders/:id/deliver
 * Update order to delivered
 * @access Private/Admin
 */
export const updateOrderToDelivered = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    ApiResponse.notFound('Order not found').send(res);
    return;
  }

  order.isDelivered = true;
  order.deliveredAt = new Date();

  const updatedOrder = await order.save();

  ApiResponse.success(
    { order: updatedOrder },
    'Order marked as delivered'
  ).send(res);
});

/**
 * GET /api/orders/myorders
 * Get logged in user's orders
 * @access Private
 */
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

  ApiResponse.success({ orders }, 'Orders retrieved successfully').send(res);
});

/**
 * GET /api/orders
 * Get all orders
 * @access Private/Admin
 */
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({})
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  ApiResponse.success({ orders }, 'All orders retrieved successfully').send(res);
});
