import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { swaggerSuccess, standardAuthErrors, standardValidationErrors } from '../../../../shared/infrastructure/http/swaggerResponses.js';
import { emitHouseholdUpdated } from '../../../../sockets/emitter.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { MongooseHouseholdRepository } from '../../../household/infrastructure/persistence/MongooseHouseholdRepository.js';
import { MongoosePlanLookup } from '../../../household/infrastructure/persistence/MongoosePlanLookup.js';
import { CalendarService } from '../../application/CalendarService.js';
import { CalendarEventBody, CalendarEventPatchBody } from '../../application/schemas/calendar.schemas.js';
import { MongooseCalendarEventRepository } from '../persistence/MongooseCalendarEventRepository.js';

const calendar = new CalendarService(
  new MongooseCalendarEventRepository(),
  new GetHouseholdUseCase(new MongooseHouseholdRepository()),
  new MongoosePlanLookup(),
);

const premiumErrors = {
  '403': { description: 'El hogar no es Premium (PLAN_REQUIRED) o no puedes editar el evento' },
  '404': { description: 'Hogar o evento no encontrado' },
};

export const calendarRoutes = new Elysia({ prefix: '/calendar', detail: { tags: ['Calendar'] } })
  .use(authMiddleware)
  .get('/:householdId', async ({ params, query, user, set }: any) => {
    const result = await calendar.list(params.householdId, user.id, query.from, query.to);
    const response = ApiResponse.success(result, 'Eventos del rango', 200);
    set.status = response.status;
    return response.body;
  }, {
    query: t.Object({ from: t.String(), to: t.String() }),
    detail: {
      summary: 'Eventos entre from y to (ISO 8601), con los repetidos ya expandidos',
      responses: { '200': swaggerSuccess('Eventos del rango', []), ...standardValidationErrors, ...premiumErrors, ...standardAuthErrors },
    },
  })
  .post('/:householdId', async ({ params, body, user, set }: any) => {
    const result = await calendar.create(params.householdId, user.id, body);
    emitHouseholdUpdated(params.householdId, 'calendar', user.id);
    const response = ApiResponse.success(result, 'Evento creado', 201);
    set.status = response.status;
    return response.body;
  }, {
    body: CalendarEventBody,
    detail: { summary: 'Crear un evento', responses: { ...standardValidationErrors, ...premiumErrors, ...standardAuthErrors } },
  })
  .patch('/events/:eventId', async ({ params, body, user, set }: any) => {
    const result = await calendar.update(params.eventId, user.id, body);
    emitHouseholdUpdated(result.household_id, 'calendar', user.id);
    const response = ApiResponse.success(result, 'Evento actualizado', 200);
    set.status = response.status;
    return response.body;
  }, {
    body: CalendarEventPatchBody,
    detail: { summary: 'Editar un evento (quien lo creó o un admin)', responses: { ...standardValidationErrors, ...premiumErrors, ...standardAuthErrors } },
  })
  .delete('/events/:eventId', async ({ params, user, set }: any) => {
    const removed = await calendar.remove(params.eventId, user.id);
    emitHouseholdUpdated(removed.household_id, 'calendar', user.id);
    const response = ApiResponse.success({ success: true }, 'Evento eliminado', 200);
    set.status = response.status;
    return response.body;
  }, {
    detail: { summary: 'Borrar un evento (quien lo creó o un admin)', responses: { ...premiumErrors, ...standardAuthErrors } },
  });
