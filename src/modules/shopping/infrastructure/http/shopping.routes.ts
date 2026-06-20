import { Elysia, t } from 'elysia';
import { ShoppingController } from '../../shopping.controller.js';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { createListSchema, addItemSchema, toggleItemSchema } from '../../shopping.schema.js';

export const shoppingRoutes = new Elysia({ prefix: '/shopping' })
  .use(authMiddleware)
  .get('/:householdId/lists', ShoppingController.getLists, {
    params: t.Object({ householdId: t.String() }),
  })
  .post('/:householdId/lists', ShoppingController.createList, {
    params: t.Object({ householdId: t.String() }),
    body: createListSchema,
  })
  .post('/:householdId/lists/:listId/items', ShoppingController.addItem, {
    params: t.Object({ householdId: t.String(), listId: t.String() }),
    body: addItemSchema,
  })
  .patch('/:householdId/lists/:listId/items/:itemId', ShoppingController.toggleItem, {
    params: t.Object({ householdId: t.String(), listId: t.String(), itemId: t.String() }),
    body: toggleItemSchema,
  })
  .delete('/:householdId/lists/:listId', ShoppingController.archiveList, {
    params: t.Object({ householdId: t.String(), listId: t.String() }),
  });
