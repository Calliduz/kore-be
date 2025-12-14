import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../types/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middleware/index.js";
import { User } from "../models/User.model.js";
import {
  CreateAddressInput,
  UpdateAddressInput,
} from "../schemas/address.schema.js";

/**
 * GET /api/users/addresses
 * Get user's saved addresses
 * @access Private
 */
export const getAddresses = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      ApiResponse.notFound("User not found").send(res);
      return;
    }

    ApiResponse.success(
      { addresses: user.addresses },
      "Addresses retrieved successfully"
    ).send(res);
  }
);

/**
 * POST /api/users/addresses
 * Create new address
 * @access Private
 */
export const createAddress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const input = req.body as CreateAddressInput;

    const user = await User.findById(req.user._id);
    if (!user) {
      ApiResponse.notFound("User not found").send(res);
      return;
    }

    // If this is set as default, unset other defaults
    if (input.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      input.isDefault = true;
    }

    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    user.addresses.push(newAddress as any);
    await user.save();

    ApiResponse.created(
      { address: user.addresses[user.addresses.length - 1] },
      "Address created successfully"
    ).send(res);
  }
);

/**
 * PUT /api/users/addresses/:id
 * Update address
 * @access Private
 */
export const updateAddress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const { id } = req.params;
    const input = req.body as UpdateAddressInput;

    const user = await User.findById(req.user._id);
    if (!user) {
      ApiResponse.notFound("User not found").send(res);
      return;
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === id
    );
    if (addressIndex === -1) {
      ApiResponse.notFound("Address not found").send(res);
      return;
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // Update address fields
    Object.assign(user.addresses[addressIndex]!, input, {
      updatedAt: new Date(),
    });
    await user.save();

    ApiResponse.success(
      { address: user.addresses[addressIndex] },
      "Address updated successfully"
    ).send(res);
  }
);

/**
 * DELETE /api/users/addresses/:id
 * Delete address
 * @access Private
 */
export const deleteAddress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      ApiResponse.notFound("User not found").send(res);
      return;
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === id
    );
    if (addressIndex === -1) {
      ApiResponse.notFound("Address not found").send(res);
      return;
    }

    const wasDefault = user.addresses[addressIndex]!.isDefault;
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default and there are other addresses, make first one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0]!.isDefault = true;
    }

    await user.save();

    ApiResponse.success(null, "Address deleted successfully").send(res);
  }
);

/**
 * PUT /api/users/addresses/:id/default
 * Set address as default
 * @access Private
 */
export const setDefaultAddress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      ApiResponse.unauthorized("Not authenticated").send(res);
      return;
    }

    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      ApiResponse.notFound("User not found").send(res);
      return;
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === id
    );
    if (addressIndex === -1) {
      ApiResponse.notFound("Address not found").send(res);
      return;
    }

    // Unset all defaults, then set the selected one
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
    user.addresses[addressIndex]!.isDefault = true;

    await user.save();

    ApiResponse.success(
      { address: user.addresses[addressIndex] },
      "Default address updated successfully"
    ).send(res);
  }
);
