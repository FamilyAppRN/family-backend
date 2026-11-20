import { CalendarEventEntity, CalendarOccurrence } from './entities/CalendarEventEntity.js';

/** Tope por evento y consulta, para que un rango enorme no explote. */
const MAX_OCCURRENCES = 400;

function addStep(date: Date, freq: 'daily' | 'weekly' | 'monthly', steps: number): Date {
  const next = new Date(date);
  if (freq === 'daily') next.setUTCDate(next.getUTCDate() + steps);
  else if (freq === 'weekly') next.setUTCDate(next.getUTCDate() + 7 * steps);
  else next.setUTCMonth(next.getUTCMonth() + steps);
  return next;
}

/**
 * Apariciones del evento que tocan [from, to). Un evento único aparece una
 * vez; uno repetido, en cada paso hasta `until` (o el fin del rango). La
 * duración se conserva en cada aparición.
 */
export function expandOccurrences(event: CalendarEventEntity, from: Date, to: Date): CalendarOccurrence[] {
  const start = new Date(event.start_at);
  const durationMs = event.end_at ? new Date(event.end_at).getTime() - start.getTime() : 0;
  const touches = (s: Date) => s.getTime() + durationMs >= from.getTime() && s.getTime() < to.getTime();
  const toOccurrence = (s: Date): CalendarOccurrence => ({
    ...event,
    occurrence_start: s,
    occurrence_end: event.end_at ? new Date(s.getTime() + durationMs) : null,
  });

  if (!event.recurrence) return touches(start) ? [toOccurrence(start)] : [];

  const until = event.recurrence.until ? new Date(event.recurrence.until) : null;
  const result: CalendarOccurrence[] = [];
  for (let i = 0; result.length < MAX_OCCURRENCES && i < 5000; i++) {
    const s = addStep(start, event.recurrence.freq, i);
    if (s.getTime() >= to.getTime() || (until && s.getTime() > until.getTime())) break;
    if (touches(s)) result.push(toOccurrence(s));
  }
  return result;
}
