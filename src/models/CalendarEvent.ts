import { Schema, model, Document, Types } from 'mongoose';

export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly';

export interface ICalendarEvent extends Document {
  _id: Types.ObjectId;
  household_id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string | null;
  start_at: Date;
  end_at: Date | null;
  all_day: boolean;
  /** Repetición simple; null = evento único. */
  recurrence: { freq: RecurrenceFreq; until: Date | null } | null;
  attendees: Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>({
  household_id: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, default: null, maxlength: 1000 },
  start_at: { type: Date, required: true },
  end_at: { type: Date, default: null },
  all_day: { type: Boolean, default: false },
  recurrence: {
    type: new Schema({
      freq: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
      until: { type: Date, default: null },
    }, { _id: false }),
    default: null,
  },
  attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

calendarEventSchema.index({ household_id: 1, start_at: 1 });

export const CalendarEvent = model<ICalendarEvent>('CalendarEvent', calendarEventSchema);
