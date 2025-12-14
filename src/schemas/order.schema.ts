import { z } from "zod";

// Order item schema
const orderItemSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
  name: z.string().min(1, "Product name is required"),
  qty: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price cannot be negative"),
  image: z.string().min(1, "Product image is required"),
});

// Shipping address schema
const shippingAddressSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

// Create order schema
export const createOrderSchema = z.object({
  orderItems: z
    .array(orderItemSchema)
    .min(1, "Order must have at least one item"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["stripe", "paypal", "card"], {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  taxPrice: z.number().min(0, "Tax price cannot be negative"),
  shippingPrice: z.number().min(0, "Shipping price cannot be negative"),
  totalPrice: z.number().min(0, "Total price cannot be negative"),
  couponCode: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Update payment result schema
export const updatePaymentSchema = z.object({
  id: z.string().min(1, "Payment ID is required"),
  status: z.string().min(1, "Payment status is required"),
  update_time: z.string().min(1, "Update time is required"),
  email_address: z.string().email("Invalid email address"),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// Order ID param schema
export const orderIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID"),
});

export type OrderIdParam = z.infer<typeof orderIdSchema>;

// Update order status schema
export const updateStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered"], {
    errorMap: () => ({ message: "Invalid order status" }),
  }),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
