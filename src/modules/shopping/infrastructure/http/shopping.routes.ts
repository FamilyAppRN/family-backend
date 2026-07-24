import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { swaggerSuccess, standardAuthErrors, standardValidationErrors, standardNotFoundErrors, customShoppingErrors } from '../../../../shared/infrastructure/http/swaggerResponses.js';
import { MongooseShoppingRepository } from '../persistence/MongooseShoppingRepository.js';
import { MongooseHouseholdRepository } from '../../../household/infrastructure/persistence/MongooseHouseholdRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';

import { CreateShoppingListUseCase } from '../../application/useCases/createShoppingListUseCase.js';
import { GetShoppingListsUseCase } from '../../application/useCases/getShoppingListsUseCase.js';
import { AddItemToListUseCase } from '../../application/useCases/addItemToListUseCase.js';
import { ToggleItemStatusUseCase } from '../../application/useCases/toggleItemStatusUseCase.js';
import { DeleteShoppingListUseCase } from '../../application/useCases/deleteShoppingListUseCase.js';
import { UpdateShoppingListUseCase } from '../../application/useCases/updateShoppingListUseCase.js';
import { FinalizeShoppingListUseCase } from '../../application/useCases/finalizeShoppingListUseCase.js';

const shoppingRepository = new MongooseShoppingRepository();
const getHouseholdUseCase = new GetHouseholdUseCase(new MongooseHouseholdRepository());

const createShoppingListUseCase = new CreateShoppingListUseCase(shoppingRepository, getHouseholdUseCase);
const getShoppingListsUseCase = new GetShoppingListsUseCase(shoppingRepository, getHouseholdUseCase);
const addItemToListUseCase = new AddItemToListUseCase(shoppingRepository, getHouseholdUseCase);
const toggleItemStatusUseCase = new ToggleItemStatusUseCase(shoppingRepository, getHouseholdUseCase);
const deleteShoppingListUseCase = new DeleteShoppingListUseCase(shoppingRepository, getHouseholdUseCase);
const updateShoppingListUseCase = new UpdateShoppingListUseCase(shoppingRepository, getHouseholdUseCase);
const finalizeShoppingListUseCase = new FinalizeShoppingListUseCase(shoppingRepository, getHouseholdUseCase);

export const shoppingRoutes = new Elysia({ prefix: '/shopping', detail: { tags: ['Shopping'] } })
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
    }),
    detail: { 
        summary: 'Crear una nueva lista de compras',
        responses: {
            '201': swaggerSuccess("Shopping list created", { id: "list-123", name: "Supermercado", household_id: "hh-123" }),
            ...standardValidationErrors,
            ...standardAuthErrors
        }
    }
  })
  .get('/:householdId', async ({ params, query, user, set }: any) => {
    const result = await getShoppingListsUseCase.execute({
      household_id: params.householdId,
      status: query?.status,
      user_id: user.id
    });

    const response = ApiResponse.success(result, "Shopping lists retrieved", 200);
    set.status = response.status;
    return response.body;
  }, {
    query: t.Object({
      status: t.Optional(t.Union([t.Literal('active'), t.Literal('archived')]))
    }),
    detail: { 
        summary: 'Listar listas de compras de un hogar',
        responses: {
            '200': swaggerSuccess("Shopping lists retrieved", [{ id: "list-123", name: "Supermercado", items: [] }]),
            ...standardValidationErrors,
            ...standardAuthErrors
        }
    }
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
    }),
    detail: { 
        summary: 'Añadir un ítem a la lista de compras',
        responses: {
            '201': swaggerSuccess("Item added to list", { id: "item-123", name: "Leche", quantity: 2, is_completed: false }),
            ...standardValidationErrors,
            '404': customShoppingErrors.listNotFound,
            ...standardAuthErrors
        }
    }
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
    }),
    detail: { 
        summary: 'Marcar ítem como completado o pendiente',
        responses: {
            '200': swaggerSuccess("Item status toggled", { id: "item-123", is_completed: true }),
            ...standardValidationErrors,
            '404': customShoppingErrors.itemNotFound,
            ...standardAuthErrors
        }
    }
  })
  .post('/:listId/finalize', async ({ params, user, set }: any) => {
    const result = await finalizeShoppingListUseCase.execute({
      list_id: params.listId,
      user_id: user.id
    });

    const response = ApiResponse.success(result, 'Purchase finalized', 200);
    set.status = response.status;
    return response.body;
  }, {
    detail: {
      summary: 'Finalizar una compra y crear la siguiente lista vacía',
      responses: {
        '200': swaggerSuccess('Purchase finalized', { history: { completed_at: '2026-07-24T12:00:00.000Z', items: [] }, active_list: { status: 'active', items: [], history: [] } }),
        '409': customShoppingErrors.purchaseNotReady,
        '404': customShoppingErrors.listNotFound,
        ...standardAuthErrors
      }
    }
  })
  .patch('/:listId', async ({ params, body, user, set }: any) => {
    const { name } = body as { name?: string; };
    const result = await updateShoppingListUseCase.execute({
      list_id: params.listId,
      name,
      user_id: user.id
    });

    const response = ApiResponse.success(result, "Shopping list updated", 200);
    set.status = response.status;
    return response.body;
  }, {
    body: t.Object({
      name: t.Optional(t.String())
    }),
    detail: { 
        summary: 'Actualizar una lista de compras',
        responses: {
            '200': swaggerSuccess("Shopping list updated", { id: "list-123", name: "Mercado Central", status: "active" }),
            ...standardValidationErrors,
            '404': customShoppingErrors.listNotFound,
            ...standardAuthErrors
        }
    }
  })
  .delete('/:listId', async ({ params, user, set }: any) => {
    await deleteShoppingListUseCase.execute({
      list_id: params.listId,
      user_id: user.id
    });

    const response = ApiResponse.success(null, "Shopping list deleted", 200);
    set.status = response.status;
    return response.body;
  }, {
    detail: { 
        summary: 'Eliminar una lista de compras',
        responses: {
            '200': swaggerSuccess("Shopping list deleted", null),
            '404': customShoppingErrors.listNotFound,
            ...standardAuthErrors
        }
    }
  });
