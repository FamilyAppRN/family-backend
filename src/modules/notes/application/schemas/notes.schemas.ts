import { t } from 'elysia';

export const createNoteRequestSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 100 }),
  content: t.String({ minLength: 1, maxLength: 2000 }),
  color: t.Optional(t.String()),
  pinned: t.Optional(t.Boolean()),
});

export const updateNoteRequestSchema = t.Partial(
  t.Object({
    title: t.String({ minLength: 1, maxLength: 100 }),
    content: t.String({ minLength: 1, maxLength: 2000 }),
    color: t.String(),
    pinned: t.Boolean(),
  })
);

export const noteResponseSchema = t.Object({
  id: t.String(),
  household_id: t.String(),
  author_id: t.String(),
  title: t.String(),
  content: t.String(),
  color: t.String(),
  pinned: t.Boolean(),
  created_at: t.Any(),
  updated_at: t.Any(),
});

export const listNotesResponseSchema = t.Array(noteResponseSchema);
