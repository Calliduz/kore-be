import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
});

export const productIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid product ID"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
