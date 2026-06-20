import { Elysia, t } from 'elysia';
import { HouseholdController } from './household.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { createHouseholdSchema, joinHouseholdSchema } from './household.schema.js';

export const householdRoutes = new Elysia({ prefix: '/households' })
  .use(authMiddleware)
  .post('/', HouseholdController.createHousehold, {
    body: createHouseholdSchema,
  })
  .post('/join', HouseholdController.joinHousehold, {
    body: joinHouseholdSchema,
  })
  .get('/:householdId', HouseholdController.getHousehold, {
    params: t.Object({ householdId: t.String() }),
  })
  .get('/:householdId/members', HouseholdController.getMembers, {
    params: t.Object({ householdId: t.String() }),
  });
