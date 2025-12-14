export {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from "./auth.schema.js";

export {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdSchema,
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
} from "./product.schema.js";

export {
  createOrderSchema,
  updatePaymentSchema,
  orderIdSchema,
  updateStatusSchema,
  CreateOrderInput,
  UpdatePaymentInput,
  OrderIdParam,
  UpdateStatusInput,
} from "./order.schema.js";

export {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  couponIdSchema,
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
} from "./coupon.schema.js";

export {
  createReviewSchema,
  productIdSchema as reviewProductIdSchema,
  CreateReviewInput,
} from "./review.schema.js";

export {
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
  CreateAddressInput,
  UpdateAddressInput,
} from "./address.schema.js";

export {
  addPaymentMethodSchema,
  paymentMethodIdSchema,
  AddPaymentMethodInput,
} from "./paymentMethod.schema.js";

export {
  createRefundSchema,
  updateRefundStatusSchema,
  refundIdSchema,
  orderIdParamSchema,
  CreateRefundInput,
  UpdateRefundStatusInput,
} from "./refund.schema.js";
