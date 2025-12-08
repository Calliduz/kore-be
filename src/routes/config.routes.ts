import { Router } from 'express';
import { getStripeConfig } from '../controllers/payment.controller.js';

const router = Router();

/**
 * @route   GET /api/config/stripe
 * @desc    Get Stripe publishable key
 * @access  Public
 */
router.get('/stripe', getStripeConfig);

export default router;
