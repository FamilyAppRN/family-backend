import { Schema, model, Document, Types } from 'mongoose';

export interface IPushToken {
  token: string;
  device_label: string;
  registered_at: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firebase_uid: string;
  name: string;
  email: string;
  avatar_url: string | null;
  plan: 'free' | 'premium';
  plan_expires_at: Date | null;
  push_tokens: IPushToken[];
  notifications_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

const pushTokenSchema = new Schema<IPushToken>({
  token: { type: String, required: true },
  device_label: { type: String, required: true },
  registered_at: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new Schema<IUser>({
  firebase_uid: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  avatar_url: { type: String, default: null },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  plan_expires_at: { type: Date, default: null },
  push_tokens: [pushTokenSchema],
  notifications_enabled: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const User = model<IUser>('User', userSchema);
