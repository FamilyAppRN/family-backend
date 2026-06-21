import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { MongooseShoppingRepository } from '../persistence/MongooseShoppingRepository.js';

import { CreateShoppingListUseCase } from '../../application/useCases/createShoppingList.use-case.js';
import { GetShoppingListsUseCase } from '../../application/useCases/getShoppingLists.use-case.js';
import { AddItemToListUseCase } from '../../application/useCases/addItemToList.use-case.js';
import { ToggleItemStatusUseCase } from '../../application/useCases/toggleItemStatus.use-case.js';
import { DeleteShoppingListUseCase } from '../../application/useCases/deleteShoppingList.use-case.js';

const shoppingRepository = new MongooseShoppingRepository();

const createShoppingListUseCase = new CreateShoppingListUseCase(shoppingRepository);
const getShoppingListsUseCase = new GetShoppingListsUseCase(shoppingRepository);
const addItemToListUseCase = new AddItemToListUseCase(shoppingRepository);
const toggleItemStatusUseCase = new ToggleItemStatusUseCase(shoppingRepository);
const deleteShoppingListUseCase = new DeleteShoppingListUseCase(shoppingRepository);

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
  .get('/:householdId', async ({ params, set }: any) => {
    const result = await getShoppingListsUseCase.execute({
      household_id: params.householdId
    });

    const response = ApiResponse.success(result, "Shopping lists retrieved", 200);
    set.status = response.status;
    return response.body;
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
  .patch('/:listId/items/:itemId', async ({ params, body, set }: any) => {
    const { is_completed } = body as { is_completed: boolean; };
    const result = await toggleItemStatusUseCase.execute({
      list_id: params.listId,
      item_id: params.itemId,
      is_completed
    });

    const response = ApiResponse.success(result, "Item status toggled", 200);
    set.status = response.status;
    return response.body;
  }, {
    body: t.Object({
      is_completed: t.Boolean()
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
