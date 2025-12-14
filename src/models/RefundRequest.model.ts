import mongoose, { Schema, Document } from "mongoose";

// Refund item interface
export interface IRefundItem {
  product: mongoose.Types.ObjectId;
  qty: number;
  refundAmount: number;
}

// Refund request document interface
export interface IRefundRequestDocument extends Document {
  _id: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  reason:
    | "damaged"
    | "wrong_item"
    | "not_as_described"
    | "changed_mind"
    | "other";
  description?: string;
  items: IRefundItem[];
  totalRefundAmount: number;
  status: "pending" | "approved" | "rejected" | "processed";
  adminNotes?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refundItemSchema = new Schema<IRefundItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qty: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const refundRequestSchema = new Schema<IRefundRequestDocument>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    reason: {
      type: String,
      enum: {
        values: [
          "damaged",
          "wrong_item",
          "not_as_described",
          "changed_mind",
          "other",
        ],
        message: "Invalid refund reason",
      },
      required: [true, "Refund reason is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    items: {
      type: [refundItemSchema],
      required: true,
      validate: {
        validator: (items: IRefundItem[]) => items.length > 0,
        message: "At least one item is required for refund",
      },
    },
    totalRefundAmount: {
      type: Number,
      required: [true, "Total refund amount is required"],
      min: [0, "Refund amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Admin notes cannot exceed 500 characters"],
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// Indexes
refundRequestSchema.index({ order: 1, user: 1 });
refundRequestSchema.index({ status: 1 });
refundRequestSchema.index({ createdAt: -1 });

export const RefundRequest = mongoose.model<IRefundRequestDocument>(
  "RefundRequest",
  refundRequestSchema
);
