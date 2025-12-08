import { Request, Response } from 'express';
import { Product } from '../models/Product.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/index.js';
import {
  parsePaginationQuery,
  buildCursorQuery,
  buildFieldSelection,
  createPaginatedResponse,
} from '../utils/pagination.js';
import { CreateProductInput, UpdateProductInput, ProductQuery } from '../schemas/index.js';

/**
 * GET /products
 * Get products with cursor-based pagination, search, filters, and sorting
 * Query params: search, category, sort, minPrice, maxPrice
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ProductQuery & { 
    search?: string; 
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
  const pagination = parsePaginationQuery(query);

  // Build filter
  const filter: Record<string, unknown> = { isActive: true };

  // Category filter (supports single string or array of strings)
  if (query.category) {
    if (Array.isArray(query.category)) {
      filter.category = { $in: query.category };
    } else {
      filter.category = query.category;
    }
  }

  // Search filter (case-insensitive regex for fuzzy matching)
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
    ];
  }

  // Price range filter
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) {
      (filter.price as Record<string, number>).$gte = parseFloat(query.minPrice);
    }
    if (query.maxPrice) {
      (filter.price as Record<string, number>).$lte = parseFloat(query.maxPrice);
    }
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  // Build sort options
  let sortOptions: Record<string, 1 | -1> = { _id: 1 };
  switch (query.sort) {
    case 'price_asc':
      sortOptions = { price: 1, _id: 1 };
      break;
    case 'price_desc':
      sortOptions = { price: -1, _id: 1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1, _id: 1 };
      break;
    case 'name_asc':
      sortOptions = { name: 1, _id: 1 };
      break;
  }

  // Add cursor filter (for pagination without sort conflicts)
  const cursorFilter = buildCursorQuery(pagination.cursor);
  const combinedFilter = { ...filter, ...cursorFilter };

  // Build field selection
  const fields = buildFieldSelection(pagination.fields);

  // Execute query with pagination
  const limit = pagination.limit || 20;
  let queryBuilder = Product.find(combinedFilter);
  
  if (fields) {
    queryBuilder = queryBuilder.select(fields);
  }
  
  const products = await queryBuilder
    .sort(sortOptions)
    .limit(limit + 1)
    .lean();

  // Check if there are more results
  const hasMore = products.length > limit;
  const items = hasMore ? products.slice(0, limit) : products;
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? String(lastItem._id) : null;

  // Transform to frontend format
  const transformedProducts = items.map(p => ({
    id: String(p._id),
    name: p.name,
    price: p.price,
    description: p.description,
    image: p.images?.[0] || '',
    images: p.images || [],
    category: p.category,
    stock: p.stock,
  }));

  ApiResponse.success({
    data: transformedProducts,
    pagination: {
      hasMore,
      nextCursor,
    }
  }, 'Products retrieved successfully').send(res);
});

/**
 * GET /products/:id
 * Get a single product by ID
 */
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fields = req.query.fields as string | undefined;

  let queryBuilder = Product.findById(id);

  if (fields) {
    const fieldSelection = buildFieldSelection(fields);
    if (fieldSelection) {
      queryBuilder = queryBuilder.select(fieldSelection);
    }
  }

  const product = await queryBuilder.lean();

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Transform to frontend format
  const transformedProduct = {
    id: String(product._id),
    name: product.name,
    price: product.price,
    description: product.description,
    image: product.images?.[0] || '',
    category: product.category,
  };

  ApiResponse.success(transformedProduct, 'Product retrieved successfully').send(res);
});

/**
 * POST /api/products
 * Create a new product (admin only)
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateProductInput;

  const product = await Product.create(input);

  ApiResponse.created({ product }, 'Product created successfully').send(res);
});

/**
 * PUT /api/products/:id
 * Update a product (admin only)
 */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input = req.body as UpdateProductInput;

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true }
  ).lean();

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  ApiResponse.success({ product }, 'Product updated successfully').send(res);
});

/**
 * DELETE /api/products/:id
 * Delete a product (admin only)
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  ApiResponse.success(null, 'Product deleted successfully').send(res);
});

/**
 * GET /api/products/search
 * Search products by text
 */
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ProductQuery;
  const pagination = parsePaginationQuery(query);

  if (!query.search) {
    throw ApiError.badRequest('Search query is required');
  }

  const filter: Record<string, unknown> = {
    $text: { $search: query.search },
    isActive: true,
  };

  // Add cursor filter
  const cursorFilter = buildCursorQuery(pagination.cursor);
  const combinedFilter = { ...filter, ...cursorFilter };

  const limit = pagination.limit || 20;
  const products = await Product.find(combinedFilter)
    .select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, _id: 1 })
    .limit(limit + 1)
    .lean();

  const result = createPaginatedResponse(products, limit);

  ApiResponse.success(result, 'Search results retrieved').send(res);
});
