import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { swaggerSuccess, swaggerError, standardAuthErrors, standardValidationErrors, standardNotFoundErrors, customHouseholdErrors } from '../../../../shared/infrastructure/http/swaggerResponses.js';
import { MongooseHouseholdRepository } from '../persistence/MongooseHouseholdRepository.js';

import { CreateHouseholdUseCase } from '../../application/useCases/CreateHouseholdUseCase.js';
import { GetHouseholdUseCase } from '../../application/useCases/GetHouseholdUseCase.js';
import { UpdateHouseholdUseCase } from '../../application/useCases/UpdateHouseholdUseCase.js';
import { AddMemberUseCase } from '../../application/useCases/AddMemberUseCase.js';
import { RemoveMemberUseCase } from '../../application/useCases/RemoveMemberUseCase.js';
import { SendHouseholdInvitationUseCase } from '../../application/useCases/SendHouseholdInvitationUseCase.js';
import { LoggingEmailService } from '../../../../shared/infrastructure/email/LoggingEmailService.js';

const repository = new MongooseHouseholdRepository();
const emailService = new LoggingEmailService();

export const householdRoutes = new Elysia({ prefix: '/households', detail: { tags: ['Households'] } })
  .use(authMiddleware)

  .post('/', async ({ body, user, set }: any) => {
    const useCase = new CreateHouseholdUseCase(repository);
    const data = {
        name: (body as any).name,
        user_id: user.id,
        user_name: user.name,

        settings: (body as any).settings
    };
    const result = await useCase.execute(data);
    const response = ApiResponse.success(result, "Hogar creado", 201);
    set.status = response.status;
    return response.body;
  }, {
      body: t.Object({
          name: t.String({ minLength: 1 }),
          settings: t.Optional(t.Object({
              timezone: t.String(),
              locale: t.String()
          }))
      }),
      detail: { 
          summary: 'Crear un nuevo hogar',
          responses: {
              '201': swaggerSuccess("Hogar creado", { id: "hh-123", name: "Casa principal", members: [{ userId: "user-1", role: "owner" }] }),
              ...standardValidationErrors,
              ...standardAuthErrors
          }
      }
  })

  .get('/:householdId', async ({ params, user, set }: any) => {
    const useCase = new GetHouseholdUseCase(repository);
    const result = await useCase.execute({
        householdId: params.householdId,
        userId: user.id
    });
    const response = ApiResponse.success(result, "Detalles del hogar");
    set.status = response.status;
    return response.body;
  }, {
      detail: { 
          summary: 'Obtener detalles de un hogar',
          responses: {
              '200': swaggerSuccess("Detalles del hogar", { id: "hh-123", name: "Casa principal", members: [] }),
              '404': customHouseholdErrors.notFound,
              '403': customHouseholdErrors.userNotInHousehold,
              ...standardAuthErrors
          }
      }
  })

  .patch('/:householdId', async ({ params, body, user, set }: any) => {
    const useCase = new UpdateHouseholdUseCase(repository);
    const data = {
        householdId: params.householdId,
        userId: user.id,
        name: (body as any).name,
        settings: (body as any).settings
    };
    const result = await useCase.execute(data);
    const response = ApiResponse.success(result, "Hogar actualizado");
    set.status = response.status;
    return response.body;
  }, {
      body: t.Object({
          name: t.Optional(t.String({ minLength: 1 })),
          settings: t.Optional(t.Object({
              timezone: t.String(),
              locale: t.String()
          }))
      }),
      detail: { 
          summary: 'Actualizar configuración del hogar',
          responses: {
              '200': swaggerSuccess("Hogar actualizado", { id: "hh-123", name: "Casa secundaria" }),
              ...standardValidationErrors,
              '404': customHouseholdErrors.notFound,
              '403': customHouseholdErrors.notAdmin,
              ...standardAuthErrors
          }
      }
  })

  .post('/join', async ({ body, user, set }: any) => {
    const useCase = new AddMemberUseCase(repository);
    const data = {
        inviteCode: (body as any).inviteCode,
        userId: user.id,
        userName: user.name
    };
    const result = await useCase.execute(data);
    const response = ApiResponse.success(result, "Te has unido al hogar");
    set.status = response.status;
    return response.body;
  }, {
      body: t.Object({
          inviteCode: t.String()
      }),
      detail: { 
          summary: 'Unirse a un hogar con código de invitación',
          responses: {
              '200': swaggerSuccess("Te has unido al hogar", { id: "hh-123", name: "Casa principal" }),
              ...standardValidationErrors,
              '400': customHouseholdErrors.invalidInviteCode,
              '409': customHouseholdErrors.userAlreadyInHousehold,
              ...standardAuthErrors
          }
      }
  })

  .post('/:householdId/invitations', async ({ params, body, user, set }: any) => {
    const useCase = new SendHouseholdInvitationUseCase(repository, emailService);
    const result = await useCase.execute({
      householdId: params.householdId,
      requestingUserId: user.id,
      requestingUserName: user.name,
      recipientEmail: (body as any).email
    });
    const response = ApiResponse.success(result, 'Invitación enviada', 202);
    set.status = response.status;
    return response.body;
  }, {
    body: t.Object({
      email: t.String({ format: 'email' })
    }),
    detail: { 
        summary: 'Enviar invitación a un usuario',
        responses: {
            '202': swaggerSuccess("Invitación enviada", null),
            ...standardValidationErrors,
            '404': customHouseholdErrors.notFound,
            '403': customHouseholdErrors.notAdmin,
            ...standardAuthErrors
        }
    }
  })

  .delete('/:householdId/members/:targetUserId', async ({ params, user, set }: any) => {
    const useCase = new RemoveMemberUseCase(repository);
    const data = {
        householdId: params.householdId,
        requestingUserId: user.id,
        targetUserId: params.targetUserId
    };
    const result = await useCase.execute(data);
    const response = ApiResponse.success(result, "Miembro eliminado del hogar");
    set.status = response.status;
    return response.body;
  }, {
      detail: { 
          summary: 'Eliminar un miembro del hogar',
          responses: {
              '200': swaggerSuccess("Miembro eliminado del hogar", null),
              '404': customHouseholdErrors.notFound,
              '403': customHouseholdErrors.ownerCannotLeave,
              ...standardAuthErrors
          }
      }
  });
