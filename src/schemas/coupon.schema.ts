import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code cannot exceed 20 characters")
    .transform((val) => val.toUpperCase().trim()),
  discountType: z.enum(["percentage", "fixed"], {
    errorMap: () => ({
      message: "Discount type must be either percentage or fixed",
    }),
  }),
  discountValue: z.number().min(0, "Discount value cannot be negative"),
  minPurchase: z
    .number()
    .min(0, "Minimum purchase cannot be negative")
    .optional()
    .default(0),
  maxUses: z
    .number()
    .min(0, "Max uses cannot be negative")
    .optional()
    .default(0),
  isActive: z.boolean().optional().default(true),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  cartTotal: z.number().min(0, "Cart total cannot be negative"),
});

export const couponIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid coupon ID"),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
