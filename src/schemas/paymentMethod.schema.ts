import { z } from "zod";

export const addPaymentMethodSchema = z.object({
  stripePaymentMethodId: z
    .string()
    .min(1, "Stripe payment method ID is required"),
});

export const paymentMethodIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid payment method ID"),
});

export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodSchema>;
