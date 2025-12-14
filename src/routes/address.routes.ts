import { Router } from "express";
import { authenticate, validateMultiple } from "../middleware/index.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address.controller.js";
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
} from "../schemas/address.schema.js";

const router = Router();

/**
 * @route   GET /api/users/addresses
 * @desc    Get user's saved addresses
 * @access  Private
 */
router.get("/", authenticate, getAddresses);

/**
 * @route   POST /api/users/addresses
 * @desc    Create new address
 * @access  Private
 */
router.post("/", authenticate, validate(createAddressSchema), createAddress);

/**
 * @route   PUT /api/users/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put(
  "/:id",
  authenticate,
  validateMultiple({ params: addressIdSchema, body: updateAddressSchema }),
  updateAddress
);

/**
 * @route   PUT /api/users/addresses/:id/default
 * @desc    Set address as default
 * @access  Private
 */
router.put(
  "/:id/default",
  authenticate,
  validate(addressIdSchema, "params"),
  setDefaultAddress
);

/**
 * @route   DELETE /api/users/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete(
  "/:id",
  authenticate,
  validate(addressIdSchema, "params"),
  deleteAddress
);

export default router;
