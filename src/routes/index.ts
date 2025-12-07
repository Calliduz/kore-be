import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  ApiResponse.success(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    'Server is running'
  ).send(res);
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/products', productRoutes);

export default router;
