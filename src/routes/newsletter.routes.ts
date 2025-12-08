import { Router } from 'express';
import { authenticate, authorize } from '../middleware/index.js';
import { subscribe, getSubscribers } from '../controllers/newsletter.controller.js';

const router = Router();

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe to newsletter
 * @access  Public
 */
router.post('/subscribe', subscribe);

/**
 * @route   GET /api/newsletter/subscribers
 * @desc    Get all subscribers
 * @access  Private/Admin
 */
router.get('/subscribers', authenticate, authorize('admin'), getSubscribers);

export default router;
