import { Types } from 'mongoose';
import { CalendarEvent, ICalendarEvent } from '../../../../models/CalendarEvent.js';
import { CalendarEventEntity } from '../../domain/entities/CalendarEventEntity.js';
import {
  CalendarEventChanges,
  CalendarEventRepository,
  NewCalendarEvent,
} from '../../domain/repositories/CalendarEventRepository.js';

export class MongooseCalendarEventRepository implements CalendarEventRepository {
  private map(doc: ICalendarEvent): CalendarEventEntity {
    return {
      id: doc._id.toString(),
      household_id: doc.household_id.toString(),
      created_by: doc.created_by.toString(),
      title: doc.title,
      description: doc.description ?? null,
      start_at: doc.start_at,
      end_at: doc.end_at ?? null,
      all_day: doc.all_day,
      recurrence: doc.recurrence ? { freq: doc.recurrence.freq, until: doc.recurrence.until ?? null } : null,
      attendees: (doc.attendees ?? []).map((id) => id.toString()),
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  }

  async create(data: NewCalendarEvent): Promise<CalendarEventEntity> {
    const saved = await new CalendarEvent({
      ...data,
      attendees: data.attendees.map((id) => new Types.ObjectId(id)),
    }).save();
    return this.map(saved.toObject() as ICalendarEvent);
  }

  async findById(id: string): Promise<CalendarEventEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await CalendarEvent.findById(id).lean();
    return doc ? this.map(doc as ICalendarEvent) : null;
  }

  async findCandidates(householdId: string, from: Date, to: Date): Promise<CalendarEventEntity[]> {
    const docs = await CalendarEvent.find({
      household_id: householdId,
      start_at: { $lt: to },
      $or: [
        { recurrence: null, $or: [{ start_at: { $gte: from } }, { end_at: { $gte: from } }] },
        { recurrence: { $ne: null }, $or: [{ 'recurrence.until': null }, { 'recurrence.until': { $gte: from } }] },
      ],
    }).sort({ start_at: 1 }).lean();
    return docs.map((doc) => this.map(doc as ICalendarEvent));
  }

  async update(id: string, changes: CalendarEventChanges): Promise<CalendarEventEntity | null> {
    const update: Record<string, unknown> = { ...changes };
    if (changes.attendees) update.attendees = changes.attendees.map((a) => new Types.ObjectId(a));
    const doc = await CalendarEvent.findByIdAndUpdate(id, update, { new: true }).lean();
    return doc ? this.map(doc as ICalendarEvent) : null;
  }

  async delete(id: string): Promise<void> {
    await CalendarEvent.findByIdAndDelete(id);
  }
}
