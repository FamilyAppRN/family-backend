import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { MongooseNoteRepository } from '../persistence/MongooseNoteRepository.js';
import { CreateNoteUseCase } from '../../application/createNoteUseCase.js';
import { ListNotesUseCase } from '../../application/listNotesUseCase.js';
import { UpdateNoteUseCase } from '../../application/updateNoteUseCase.js';
import { DeleteNoteUseCase } from '../../application/deleteNoteUseCase.js';
import { createNoteRequestSchema, updateNoteRequestSchema } from '../../application/schemas/notes.schemas.js';

export const notesRoutes = new Elysia({ prefix: '/notes' })
  .use(authMiddleware)
  .get('/:householdId', async ({ params, set }) => {
    const repository = new MongooseNoteRepository();
    const useCase = new ListNotesUseCase(repository);
    const result = await useCase.execute({ householdId: params.householdId });

    const response = ApiResponse.success(result, "Notas obtenidas exitosamente", 200);
    set.status = response.status;
    return response.body;
  }, {
    params: t.Object({ householdId: t.String() }),
  })
  .post('/:householdId', async ({ params, user, body, set }: any) => {
    const repository = new MongooseNoteRepository();
    const useCase = new CreateNoteUseCase(repository);
    const result = await useCase.execute({
      ...body,
      householdId: params.householdId,
      userId: user.id
    });

    const response = ApiResponse.success(result, "Nota creada exitosamente", 201);
    set.status = response.status;
    return response.body;
  }, {
    params: t.Object({ householdId: t.String() }),
    body: createNoteRequestSchema,
  })
  .patch('/:householdId/:noteId', async ({ params, user, body, set }: any) => {
    const repository = new MongooseNoteRepository();
    const useCase = new UpdateNoteUseCase(repository);
    const result = await useCase.execute({
      ...body,
      householdId: params.householdId,
      noteId: params.noteId,
      userId: user.id
    });

    const response = ApiResponse.success(result, "Nota actualizada exitosamente", 200);
    set.status = response.status;
    return response.body;
  }, {
    params: t.Object({ householdId: t.String(), noteId: t.String() }),
    body: updateNoteRequestSchema,
  })
  .delete('/:householdId/:noteId', async ({ params, user, set }: any) => {
    const repository = new MongooseNoteRepository();
    const useCase = new DeleteNoteUseCase(repository);
    const result = await useCase.execute({
      householdId: params.householdId,
      noteId: params.noteId,
      userId: user.id
    });

    const response = ApiResponse.success(result, "Nota eliminada exitosamente", 200);
    set.status = response.status;
    return response.body;
  }, {
    params: t.Object({ householdId: t.String(), noteId: t.String() }),
  });
