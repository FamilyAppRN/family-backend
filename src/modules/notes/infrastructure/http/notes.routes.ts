import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { swaggerSuccess, standardAuthErrors, standardValidationErrors, standardNotFoundErrors, customNoteErrors } from '../../../../shared/infrastructure/http/swaggerResponses.js';
import { MongooseHouseholdRepository } from '../../../household/infrastructure/persistence/MongooseHouseholdRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { MongooseNoteRepository } from '../persistence/MongooseNoteRepository.js';
import { CreateNoteUseCase } from '../../application/createNoteUseCase.js';
import { ListNotesUseCase } from '../../application/listNotesUseCase.js';
import { UpdateNoteUseCase } from '../../application/updateNoteUseCase.js';
import { DeleteNoteUseCase } from '../../application/deleteNoteUseCase.js';
import { createNoteRequestSchema, updateNoteRequestSchema } from '../../application/schemas/notes.schemas.js';

const noteRepository = new MongooseNoteRepository();
const getHouseholdUseCase = new GetHouseholdUseCase(new MongooseHouseholdRepository());

const listNotesUseCase = new ListNotesUseCase(noteRepository, getHouseholdUseCase);
const createNoteUseCase = new CreateNoteUseCase(noteRepository, getHouseholdUseCase);
const updateNoteUseCase = new UpdateNoteUseCase(noteRepository, getHouseholdUseCase);
const deleteNoteUseCase = new DeleteNoteUseCase(noteRepository, getHouseholdUseCase);

export const notesRoutes = new Elysia({ prefix: '/notes', detail: { tags: ['Notes'] } })
  .use(authMiddleware)
  .get('/:householdId', async ({ params, user, set }: any) => {
    const result = await listNotesUseCase.execute({ householdId: params.householdId, userId: user.id });

    const response = ApiResponse.success(result, "Notas obtenidas exitosamente", 200);
    set.status = response.status;
    return response.body;
  }, {
    params: t.Object({ householdId: t.String() }),
    detail: { 
        summary: 'Listar notas de un hogar',
        responses: {
            '200': swaggerSuccess("Notes retrieved successfully", [{ id: "note-123", title: "Recetas", content: "..." }]),
            ...standardValidationErrors,
            ...standardAuthErrors
        }
    }
  })
  .post('/:householdId', async ({ params, user, body, set }: any) => {
    const result = await createNoteUseCase.execute({
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
    detail: { 
        summary: 'Crear una nueva nota',
        responses: {
            '201': swaggerSuccess("Note created successfully", { id: "note-123", title: "Recetas", content: "..." }),
            ...standardValidationErrors,
            ...standardAuthErrors
        }
    }
  })
  .patch('/:householdId/:noteId', async ({ params, user, body, set }: any) => {
    const result = await updateNoteUseCase.execute({
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
    detail: { 
        summary: 'Actualizar una nota existente',
        responses: {
            '200': swaggerSuccess("Note updated successfully", { id: "note-123", title: "Recetas Actualizadas", content: "..." }),
            ...standardValidationErrors,
            '404': customNoteErrors.notFound,
            '403': customNoteErrors.forbidden,
            ...standardAuthErrors
        }
    }
  })
  .delete('/:householdId/:noteId', async ({ params, user, set }: any) => {
    const result = await deleteNoteUseCase.execute({
      householdId: params.householdId,
      noteId: params.noteId,
      userId: user.id
    });

    const response = ApiResponse.success(result, "Nota eliminada exitosamente", 200);
    set.status = response.status;
    return response.body;
  }, {
    params: t.Object({ householdId: t.String(), noteId: t.String() }),
    detail: { 
        summary: 'Eliminar una nota',
        responses: {
            '200': swaggerSuccess("Note deleted successfully", null),
            ...standardValidationErrors,
            '404': customNoteErrors.notFound,
            '403': customNoteErrors.forbidden,
            ...standardAuthErrors
        }
    }
  });
