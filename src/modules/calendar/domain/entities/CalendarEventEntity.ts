export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly';

export interface CalendarEventEntity {
  id: string;
  household_id: string;
  created_by: string;
  title: string;
  description: string | null;
  start_at: Date;
  end_at: Date | null;
  all_day: boolean;
  recurrence: { freq: RecurrenceFreq; until: Date | null } | null;
  attendees: string[];
  created_at: Date;
  updated_at: Date;
}

/** Una aparición concreta de un evento (los repetidos generan varias). */
export interface CalendarOccurrence extends CalendarEventEntity {
  occurrence_start: Date;
  occurrence_end: Date | null;
}
