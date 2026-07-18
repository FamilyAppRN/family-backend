import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { swaggerSuccess, standardAuthErrors, standardValidationErrors, standardNotFoundErrors, customNoteErrors } from '../../../../shared/infrastructure/http/swaggerResponses.js';
import { MongooseNoteRepository } from '../persistence/MongooseNoteRepository.js';
import { CreateNoteUseCase } from '../../application/createNoteUseCase.js';
import { ListNotesUseCase } from '../../application/listNotesUseCase.js';
import { UpdateNoteUseCase } from '../../application/updateNoteUseCase.js';
import { DeleteNoteUseCase } from '../../application/deleteNoteUseCase.js';
import { createNoteRequestSchema, updateNoteRequestSchema } from '../../application/schemas/notes.schemas.js';

export const notesRoutes = new Elysia({ prefix: '/notes', detail: { tags: ['Notes'] } })
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
