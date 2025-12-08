import { Router } from 'express';
import { authenticate, authorize, validateMultiple } from '../middleware/index.js';
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getAllOrders,
} from '../controllers/order.controller.js';
import { createOrderSchema, updatePaymentSchema, orderIdSchema } from '../schemas/order.schema.js';

const router = Router();

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validateMultiple({ body: createOrderSchema }),
  addOrderItems
);

/**
 * @route   GET /api/orders/myorders
 * @desc    Get logged in user's orders
 * @access  Private
 */
router.get('/myorders', authenticate, getMyOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validateMultiple({ params: orderIdSchema }),
  getOrderById
);

/**
 * @route   PUT /api/orders/:id/pay
 * @desc    Update order to paid
 * @access  Private
 */
router.put(
  '/:id/pay',
  authenticate,
  validateMultiple({ params: orderIdSchema, body: updatePaymentSchema }),
  updateOrderToPaid
);

/**
 * @route   PUT /api/orders/:id/deliver
 * @desc    Update order to delivered
 * @access  Private/Admin
 */
router.put(
  '/:id/deliver',
  authenticate,
  authorize('admin'),
  validateMultiple({ params: orderIdSchema }),
  updateOrderToDelivered
);

/**
 * @route   GET /api/orders
 * @desc    Get all orders
 * @access  Private/Admin
 */
router.get('/', authenticate, authorize('admin'), getAllOrders);

export default router;
