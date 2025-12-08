import { Router, raw } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createPaymentIntent, handleStripeWebhook } from '../controllers/payment.controller.js';

const router = Router();

/**
 * @route   POST /api/payment/create-payment-intent
 * @desc    Create Stripe PaymentIntent
 * @access  Private
 */
router.post('/create-payment-intent', authenticate, createPaymentIntent);

/**
 * @route   POST /api/payment/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (verified with Stripe signature)
 * Note: Raw body needed for signature verification
 */
router.post('/webhook', raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
