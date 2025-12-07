import { z } from 'zod';

/**
 * Create product schema
 */
export const createProductSchema = z.object({
  name: z
    .string({
      required_error: 'Product name is required',
    })
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name cannot exceed 200 characters')
    .trim(),
  description: z
    .string({
      required_error: 'Description is required',
    })
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim(),
  price: z
    .number({
      required_error: 'Price is required',
      invalid_type_error: 'Price must be a number',
    })
    .min(0, 'Price cannot be negative')
    .max(1000000, 'Price cannot exceed 1,000,000'),
  category: z
    .string({
      required_error: 'Category is required',
    })
    .min(2, 'Category must be at least 2 characters')
    .max(100, 'Category cannot exceed 100 characters')
    .trim(),
  stock: z
    .number({
      invalid_type_error: 'Stock must be a number',
    })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .default(0),
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(10, 'Cannot have more than 10 images')
    .default([]),
  isActive: z.boolean().default(true),
});

/**
 * Update product schema (all fields optional)
 */
export const updateProductSchema = createProductSchema.partial();

/**
 * Product query schema for pagination
 */
export const productQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100))
    .optional(),
  fields: z
    .string()
    .regex(/^[a-zA-Z_,]+$/, 'Invalid fields format')
    .optional(),
  category: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().max(100).optional(),
});

/**
 * Product ID param schema
 */
export const productIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
