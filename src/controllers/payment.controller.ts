import { Response } from 'express';
import Stripe from 'stripe';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middleware/index.js';
import { Order } from '../models/Order.model.js';
import { env } from '../config/env.js';

// Initialize Stripe - use latest stable API version
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/**
 * GET /api/config/stripe
 * Get Stripe publishable key
 * @access Public
 */
export const getStripeConfig = asyncHandler(async (_req: AuthRequest, res: Response) => {
  ApiResponse.success(
    { publishableKey: env.STRIPE_PUBLISHABLE_KEY },
    'Stripe configuration retrieved'
  ).send(res);
});

/**
 * POST /api/payment/create-payment-intent
 * Create a Stripe PaymentIntent for an order
 * @access Private
 */
export const createPaymentIntent = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    ApiResponse.unauthorized('Not authenticated').send(res);
    return;
  }

  const { orderId } = req.body as { orderId: string };

  if (!orderId) {
    ApiResponse.badRequest('Order ID is required').send(res);
    return;
  }

  const order = await Order.findById(orderId);

  if (!order) {
    ApiResponse.notFound('Order not found').send(res);
    return;
  }

  // Verify user owns this order
  if (order.user.toString() !== req.user._id && req.user.role !== 'admin') {
    ApiResponse.forbidden('Not authorized to pay for this order').send(res);
    return;
  }

  if (order.isPaid) {
    ApiResponse.badRequest('Order is already paid').send(res);
    return;
  }

  // Create PaymentIntent (amount in cents)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalPrice * 100),
    currency: 'usd',
    metadata: {
      orderId: order._id.toString(),
      userId: req.user._id,
    },
  });

  ApiResponse.success(
    { clientSecret: paymentIntent.client_secret },
    'Payment intent created'
  ).send(res);
});

/**
 * POST /api/payment/webhook
 * Handle Stripe webhook events
 * @access Public (but verified with Stripe signature)
 */
export const handleStripeWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    // Webhook secret not configured, just acknowledge
    res.json({ received: true });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    ApiResponse.badRequest(`Webhook Error: ${(err as Error).message}`).send(res);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.paymentResult = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            update_time: new Date().toISOString(),
            email_address: paymentIntent.receipt_email || '',
          };
          await order.save();
        }
      }
      break;
    }
    default:
      // Unhandled event type
      break;
  }

  res.json({ received: true });
});
