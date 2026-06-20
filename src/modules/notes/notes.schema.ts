import { t } from 'elysia';

export const createNoteSchema = t.Object({
  body: t.String({ maxLength: 500, error: 'Note body must be at most 500 characters' }),
  pinned: t.Optional(t.Boolean()),
  expires_at: t.String({ format: 'date-time', error: 'expires_at must be a valid date-time string' }),
});

export const updateNoteSchema = t.Partial(createNoteSchema);
