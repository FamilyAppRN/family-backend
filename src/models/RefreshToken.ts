import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  token: string;
  device_info: string;
  expires_at: Date;
  created_at: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  device_info: { type: String, required: true },
  expires_at: { type: Date, required: true, expires: 0 }, // TTL index
  created_at: { type: Date, default: Date.now }
});

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
