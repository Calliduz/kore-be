import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middleware/index.js';
import { Subscriber } from '../models/Subscriber.model.js';

/**
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter
 * @access Public
 */
export const subscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    ApiResponse.badRequest('Please provide a valid email address').send(res);
    return;
  }

  // Check if already subscribed
  const existing = await Subscriber.findOne({ email: email.toLowerCase() });
  if (existing) {
    // Return success even if already subscribed (graceful handling)
    ApiResponse.success(
      { subscribed: true },
      'You are already subscribed to our newsletter'
    ).send(res);
    return;
  }

  // Create new subscriber
  await Subscriber.create({ email: email.toLowerCase() });

  ApiResponse.created(
    { subscribed: true },
    'Successfully subscribed to newsletter'
  ).send(res);
});

/**
 * GET /api/newsletter/subscribers
 * Get all subscribers (admin only)
 * @access Private/Admin
 */
export const getSubscribers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const subscribers = await Subscriber.find({}).sort({ subscribedAt: -1 });

  ApiResponse.success(
    { subscribers, count: subscribers.length },
    'Subscribers retrieved successfully'
  ).send(res);
});
