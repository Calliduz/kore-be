import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from '../controllers/product.controller.js';
import { validate, validateMultiple } from '../middleware/validate.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdSchema,
} from '../schemas/product.schema.js';

const router = Router();

/**
 * GET /api/products
 * Get products with cursor pagination
 */
router.get('/', validate(productQuerySchema, 'query'), getProducts);

/**
 * GET /api/products/search
 * Search products
 */
router.get('/search', validate(productQuerySchema, 'query'), searchProducts);

/**
 * GET /api/products/:id
 * Get single product
 */
router.get('/:id', validate(productIdSchema, 'params'), getProduct);

/**
 * POST /api/products
 * Create product (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createProductSchema),
  createProduct
);

/**
 * PUT /api/products/:id
 * Update product (admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateMultiple({
    params: productIdSchema,
    body: updateProductSchema,
  }),
  updateProduct
);

/**
 * DELETE /api/products/:id
 * Delete product (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(productIdSchema, 'params'),
  deleteProduct
);

export default router;
