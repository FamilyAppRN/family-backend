import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  _id: Types.ObjectId;
  household_id: Types.ObjectId;
  author_id: Types.ObjectId;
  body: string;
  pinned: boolean;
  expires_at: Date;
  created_at: Date;
}

const noteSchema = new Schema<INote>({
  household_id: { type: Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  author_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, maxlength: 500 },
  pinned: { type: Boolean, default: false },
  expires_at: { type: Date, required: true, expires: 0 }, // TTL index
  created_at: { type: Date, default: Date.now }
});

export const Note = model<INote>('Note', noteSchema);
