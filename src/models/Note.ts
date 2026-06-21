import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  _id: Types.ObjectId;
  household_id: Types.ObjectId;
  author_id: Types.ObjectId;
  title: string;
  content: string;
  color?: string;
  pinned: boolean;
  created_at: Date;
  updated_at: Date;
}

const noteSchema = new Schema<INote>({
  household_id: { type: Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  author_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 100 },
  content: { type: String, required: true, maxlength: 2000 },
  color: { type: String, default: '#FFFFFF' },
  pinned: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const Note = model<INote>('Note', noteSchema);
