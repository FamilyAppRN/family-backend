import { CalendarEventEntity } from '../entities/CalendarEventEntity.js';

export type NewCalendarEvent = Omit<CalendarEventEntity, 'id' | 'created_at' | 'updated_at'>;
export type CalendarEventChanges = Partial<Pick<CalendarEventEntity,
  'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'recurrence' | 'attendees'>>;

export interface CalendarEventRepository {
  create(data: NewCalendarEvent): Promise<CalendarEventEntity>;
  findById(id: string): Promise<CalendarEventEntity | null>;
  /** Eventos que pueden aparecer en el rango: únicos dentro de él y repetidos que empezaron antes de su fin. */
  findCandidates(householdId: string, from: Date, to: Date): Promise<CalendarEventEntity[]>;
  update(id: string, changes: CalendarEventChanges): Promise<CalendarEventEntity | null>;
  delete(id: string): Promise<void>;
}
