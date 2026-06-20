import { Elysia, t } from 'elysia';
import { NotesController } from '../../notes.controller.js';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { createNoteSchema, updateNoteSchema } from '../../notes.schema.js';

export const notesRoutes = new Elysia({ prefix: '/notes' })
  .use(authMiddleware)
  .get('/:householdId', NotesController.getNotes, {
    params: t.Object({ householdId: t.String() }),
  })
  .post('/:householdId', NotesController.createNote, {
    params: t.Object({ householdId: t.String() }),
    body: createNoteSchema,
  })
  .patch('/:householdId/:noteId', NotesController.updateNote, {
    params: t.Object({ householdId: t.String(), noteId: t.String() }),
    body: updateNoteSchema,
  })
  .delete('/:householdId/:noteId', NotesController.deleteNote, {
    params: t.Object({ householdId: t.String(), noteId: t.String() }),
  });
