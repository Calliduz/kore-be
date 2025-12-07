import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshTokenDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  family: string; // Token family for rotation tracking
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    family: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for auto-expiry (MongoDB will remove expired docs)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient queries
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ family: 1, isRevoked: 1 });

/**
 * Revoke all tokens in a family (for security when reuse detected)
 */
refreshTokenSchema.statics.revokeFamily = async function (
  family: string
): Promise<void> {
  await this.updateMany({ family }, { $set: { isRevoked: true } });
};

/**
 * Revoke all tokens for a user
 */
refreshTokenSchema.statics.revokeAllForUser = async function (
  userId: mongoose.Types.ObjectId
): Promise<void> {
  await this.updateMany({ userId }, { $set: { isRevoked: true } });
};

export const RefreshToken = mongoose.model<IRefreshTokenDocument>(
  'RefreshToken',
  refreshTokenSchema
);
