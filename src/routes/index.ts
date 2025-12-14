import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import orderRoutes from "./order.routes.js";
import userRoutes from "./user.routes.js";
import configRoutes from "./config.routes.js";
import paymentRoutes from "./payment.routes.js";
import checkoutRoutes from "./checkout.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import newsletterRoutes from "./newsletter.routes.js";
import couponRoutes from "./coupon.routes.js";
import addressRoutes from "./address.routes.js";
import paymentMethodRoutes from "./paymentMethod.routes.js";
import {
  userRefundsRouter,
  adminRefundsRouter,
  orderRefundsRouter,
} from "./refund.routes.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

/**
 * Health check endpoint
 */
router.get("/health", (_req: Request, res: Response) => {
  ApiResponse.success(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    "Server is running"
  ).send(res);
});

/**
 * Mount route modules
 */
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/orders", orderRefundsRouter); // For /orders/:id/refund routes
router.use("/users", userRoutes);
router.use("/users/addresses", addressRoutes);
router.use("/users/payment-methods", paymentMethodRoutes);
router.use("/users/refunds", userRefundsRouter);
router.use("/admin/refunds", adminRefundsRouter);
router.use("/config", configRoutes);
router.use("/payment", paymentRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/coupons", couponRoutes);

export default router;
