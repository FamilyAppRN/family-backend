import { t } from 'elysia';

const Recurrence = t.Union([
  t.Object({
    freq: t.Union([t.Literal('daily'), t.Literal('weekly'), t.Literal('monthly')]),
    until: t.Optional(t.Union([t.String(), t.Null()])),
  }),
  t.Null(),
]);

/** Campos que se pueden enviar al crear o editar (fechas en ISO 8601). */
export const CalendarEventBody = t.Object({
  title: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
  start_at: t.String({ minLength: 1 }),
  end_at: t.Optional(t.Union([t.String(), t.Null()])),
  all_day: t.Optional(t.Boolean()),
  recurrence: t.Optional(Recurrence),
  attendees: t.Optional(t.Array(t.String())),
});

export const CalendarEventPatchBody = t.Partial(CalendarEventBody);

export const CalendarEventSchema = t.Object({
  id: t.String(),
  household_id: t.String(),
  created_by: t.String(),
  title: t.String(),
  description: t.Union([t.String(), t.Null()]),
  start_at: t.Any(),
  end_at: t.Any(),
  all_day: t.Boolean(),
  recurrence: t.Any(),
  attendees: t.Array(t.String()),
  created_at: t.Any(),
  updated_at: t.Any(),
});

export const CalendarOccurrenceSchema = t.Composite([
  CalendarEventSchema,
  t.Object({ occurrence_start: t.Any(), occurrence_end: t.Any() }),
]);
