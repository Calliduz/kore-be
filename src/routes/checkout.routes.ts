import { Router } from 'express';
import express from 'express';
import { authenticate } from '../middleware/index.js';
import { createPaymentIntent, handleStripeWebhook } from '../controllers/payment.controller.js';

const router = Router();

/**
 * @route   POST /api/checkout/create-payment-intent
 * @desc    Create Stripe payment intent for checkout
 * @access  Private
 */
router.post('/create-payment-intent', authenticate, createPaymentIntent);

/**
 * @route   POST /api/checkout/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (verified by Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
