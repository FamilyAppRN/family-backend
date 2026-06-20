import { Elysia, t } from 'elysia';
import { TasksController } from '../../tasks.controller.js';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  claimPointsSchema,
} from '../../tasks.schema.js';

export const tasksRoutes = new Elysia({ prefix: '/tasks' })
  .use(authMiddleware)
  .get('/:householdId', TasksController.getTasks, {
    params: t.Object({ householdId: t.String() }),
  })
  .post('/:householdId', TasksController.createTask, {
    params: t.Object({ householdId: t.String() }),
    body: createTaskSchema,
  })
  .put('/:householdId/:taskId', TasksController.updateTask, {
    params: t.Object({ householdId: t.String(), taskId: t.String() }),
    body: updateTaskSchema,
  })
  .patch('/:householdId/:taskId/status', TasksController.updateTaskStatus, {
    params: t.Object({ householdId: t.String(), taskId: t.String() }),
    body: updateTaskStatusSchema,
  })
  .post('/:householdId/:taskId/claim', TasksController.claimPoints, {
    params: t.Object({ householdId: t.String(), taskId: t.String() }),
    body: claimPointsSchema,
  })
  .delete('/:householdId/:taskId', TasksController.deleteTask, {
    params: t.Object({ householdId: t.String(), taskId: t.String() }),
  });
