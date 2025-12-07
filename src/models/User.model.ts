import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  failedLoginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual
  isLocked: boolean;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

interface IUserModel extends Model<IUserDocument> {
  // Static methods if needed
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include in queries by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.password = undefined;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// Indexes (email index is auto-created by unique: true)
userSchema.index({ createdAt: -1 });

// Virtual: Check if account is locked
userSchema.virtual('isLocked').get(function (this: IUserDocument) {
  if (!this.lockUntil) return false;
  return this.lockUntil.getTime() > Date.now();
});

// Pre-save hook: Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method: Compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method: Increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil.getTime() < Date.now()) {
    await this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates: Record<string, unknown> = {
    $inc: { failedLoginAttempts: 1 },
  };

  // Lock account if max attempts reached
  if (this.failedLoginAttempts + 1 >= env.MAX_LOGIN_ATTEMPTS) {
    updates.$set = {
      lockUntil: new Date(Date.now() + env.LOCK_TIME_MS),
    };
  }

  await this.updateOne(updates);
};

// Method: Reset failed login attempts
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
