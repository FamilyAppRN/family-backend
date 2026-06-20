import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  _id: Types.ObjectId;
  household_id: Types.ObjectId;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  assignee_id: Types.ObjectId | null;
  creator_id: Types.ObjectId;
  due_date: Date | null;
  points: number;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Phase 2 gamification fields
  reward_label: string | null;
  claimed_at: Date | null;
}

const taskSchema = new Schema<ITask>({
  household_id: { type: Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  assignee_id: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  creator_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  due_date: { type: Date, default: null },
  points: { type: Number, default: 0 },
  completed_at: { type: Date, default: null },
  reward_label: { type: String, default: null },
  claimed_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

taskSchema.index({ household_id: 1, status: 1 });

export const Task = model<ITask>('Task', taskSchema);
