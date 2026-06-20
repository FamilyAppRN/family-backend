import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { MongooseHouseholdRepository } from '../persistence/MongooseHouseholdRepository.js';

import { CreateHouseholdUseCase } from '../../application/useCases/CreateHouseholdUseCase.js';
import { GetHouseholdUseCase } from '../../application/useCases/GetHouseholdUseCase.js';
import { UpdateHouseholdUseCase } from '../../application/useCases/UpdateHouseholdUseCase.js';
import { AddMemberUseCase } from '../../application/useCases/AddMemberUseCase.js';
import { RemoveMemberUseCase } from '../../application/useCases/RemoveMemberUseCase.js';

const repository = new MongooseHouseholdRepository();

export const householdRoutes = new Elysia({ prefix: '/households' })
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
      })
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
      })
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
      })
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
  });
