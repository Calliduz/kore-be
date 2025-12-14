import { z } from "zod";

const refundReasonEnum = z.enum([
  "damaged",
  "wrong_item",
  "not_as_described",
  "changed_mind",
  "other",
]);
const refundStatusEnum = z.enum([
  "pending",
  "approved",
  "rejected",
  "processed",
]);

export const createRefundSchema = z.object({
  reason: refundReasonEnum,
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  items: z
    .array(
      z.object({
        product: z.string().regex(/^[a-f\d]{24}$/i, "Invalid product ID"),
        qty: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one item is required"),
});

export const updateRefundStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "processed"]),
  adminNotes: z
    .string()
    .max(500, "Admin notes cannot exceed 500 characters")
    .optional(),
});

export const refundIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid refund ID"),
});

export const orderIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order ID"),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type UpdateRefundStatusInput = z.infer<typeof updateRefundStatusSchema>;
