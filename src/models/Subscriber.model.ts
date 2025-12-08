import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriberDocument extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  subscribedAt: Date;
}

const subscriberSchema = new Schema<ISubscriberDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

export const Subscriber = mongoose.model<ISubscriberDocument>('Subscriber', subscriberSchema);
