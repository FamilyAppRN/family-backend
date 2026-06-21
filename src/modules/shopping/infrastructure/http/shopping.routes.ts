import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { MongooseShoppingRepository } from '../persistence/MongooseShoppingRepository.js';

import { CreateShoppingListUseCase } from '../../application/useCases/createShoppingListUseCase.js';
import { GetShoppingListsUseCase } from '../../application/useCases/getShoppingListsUseCase.js';
import { AddItemToListUseCase } from '../../application/useCases/addItemToListUseCase.js';
import { ToggleItemStatusUseCase } from '../../application/useCases/toggleItemStatusUseCase.js';
import { DeleteShoppingListUseCase } from '../../application/useCases/deleteShoppingListUseCase.js';
import { UpdateShoppingListUseCase } from '../../application/useCases/updateShoppingListUseCase.js';

const shoppingRepository = new MongooseShoppingRepository();

const createShoppingListUseCase = new CreateShoppingListUseCase(shoppingRepository);
const getShoppingListsUseCase = new GetShoppingListsUseCase(shoppingRepository);
const addItemToListUseCase = new AddItemToListUseCase(shoppingRepository);
const toggleItemStatusUseCase = new ToggleItemStatusUseCase(shoppingRepository);
const deleteShoppingListUseCase = new DeleteShoppingListUseCase(shoppingRepository);
const updateShoppingListUseCase = new UpdateShoppingListUseCase(shoppingRepository);

export const shoppingRoutes = new Elysia({ prefix: '/shopping' })
  .use(authMiddleware)
  .post('/', async ({ body, user, set }: any) => {
    const { household_id, name } = body as { household_id: string; name: string; };
    const result = await createShoppingListUseCase.execute({
      household_id,
      name,
      created_by: user.id
    });

    const response = ApiResponse.success(result, "Shopping list created", 201);
    set.status = response.status;
    return response.body;
  }, {
    body: t.Object({
      household_id: t.String(),
      name: t.String()
    })
  })
  .get('/:householdId', async ({ params, query, set }: any) => {
    const result = await getShoppingListsUseCase.execute({
      household_id: params.householdId,
      status: query?.status
    });

    const response = ApiResponse.success(result, "Shopping lists retrieved", 200);
    set.status = response.status;
    return response.body;
  }, {
    query: t.Object({
      status: t.Optional(t.Union([t.Literal('active'), t.Literal('archived')]))
    })
  })
  .post('/:listId/items', async ({ params, body, user, set }: any) => {
    const { name, quantity } = body as { name: string; quantity: number; };
    const result = await addItemToListUseCase.execute({
      list_id: params.listId,
      name,
      quantity,
      added_by: user.id
    });

    const response = ApiResponse.success(result, "Item added to list", 201);
    set.status = response.status;
    return response.body;
  }, {
    body: t.Object({
      name: t.String(),
      quantity: t.Number({ minimum: 1, default: 1 })
    })
  })
  .patch('/:listId/items/:itemId', async ({ params, body, user, set }: any) => {
    const { is_completed } = body as { is_completed: boolean; };
    const result = await toggleItemStatusUseCase.execute({
      list_id: params.listId,
      item_id: params.itemId,
      is_completed,
      userId: user.id
    });

    const response = ApiResponse.success(result, "Item status toggled", 200);
    set.status = response.status;
    return response.body;
  }, {
    body: t.Object({
      is_completed: t.Boolean()
    })
  })
  .patch('/:listId', async ({ params, body, set }: any) => {
    const { name, status } = body as { name?: string; status?: 'active' | 'archived'; };
    const result = await updateShoppingListUseCase.execute({
      list_id: params.listId,
      name,
      status
    });

    const response = ApiResponse.success(result, "Shopping list updated", 200);
    set.status = response.status;
    return response.body;
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      status: t.Optional(t.Union([t.Literal('active'), t.Literal('archived')]))
    })
  })
  .delete('/:listId', async ({ params, set }: any) => {
    await deleteShoppingListUseCase.execute({
      list_id: params.listId
    });

    const response = ApiResponse.success(null, "Shopping list deleted", 200);
    set.status = response.status;
    return response.body;
  });
