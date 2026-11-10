import { Elysia } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';

import { MongooseTaskRepository } from '../persistence/MongooseTaskRepository.js';
import { CreateTaskUseCase } from '../../application/useCases/createTaskUseCase.js';
import { ListTasksUseCase } from '../../application/useCases/listTasksUseCase.js';
import { UpdateTaskStatusUseCase } from '../../application/useCases/updateTaskStatusUseCase.js';
import { AssignTaskUseCase } from '../../application/useCases/assignTaskUseCase.js';
import { UpdateTaskUseCase } from '../../application/useCases/updateTaskUseCase.js';
import { DeleteTaskUseCase } from '../../application/useCases/deleteTaskUseCase.js';
import { MongooseHouseholdRepository } from '../../../household/infrastructure/persistence/MongooseHouseholdRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import {
    CreateTaskInputSchema,
    ListTasksQuerySchema,
    UpdateTaskStatusBodySchema,
    AssignTaskBodySchema,
    UpdateTaskBodySchema
} from '../../application/schemas/tasks.schemas.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { swaggerSuccess, standardAuthErrors, standardValidationErrors, standardNotFoundErrors, customTaskErrors } from '../../../../shared/infrastructure/http/swaggerResponses.js';

const taskRepository = new MongooseTaskRepository();
const getHouseholdUseCase = new GetHouseholdUseCase(new MongooseHouseholdRepository());

const createTaskUseCase = new CreateTaskUseCase(taskRepository, getHouseholdUseCase);
const listTasksUseCase = new ListTasksUseCase(taskRepository, getHouseholdUseCase);
const updateTaskStatusUseCase = new UpdateTaskStatusUseCase(taskRepository, getHouseholdUseCase);
const assignTaskUseCase = new AssignTaskUseCase(taskRepository, getHouseholdUseCase);
const updateTaskUseCase = new UpdateTaskUseCase(taskRepository, getHouseholdUseCase);
const deleteTaskUseCase = new DeleteTaskUseCase(taskRepository, getHouseholdUseCase);

export const tasksRoutes = new Elysia({ prefix: '/tasks' })
    .use(authMiddleware)
    .post('/', async ({ body, user, set }: any) => {
        const result = await createTaskUseCase.execute({
            ...body,
            creator_id: user.id
        });

        const response = ApiResponse.success(result, "Task created successfully", 201);
        set.status = response.status;
        return response.body;
    }, {
        body: CreateTaskInputSchema,
        detail: { 
            tags: ['Tasks'], 
            summary: 'Create a new task',
            responses: {
                '201': swaggerSuccess("Task created successfully", { id: "task-123", title: "Wash clothes", status: "pending" }),
                ...standardValidationErrors,
                ...standardAuthErrors
            }
        }
    })
    .get('/', async ({ query, user, set }: any) => {
        const result = await listTasksUseCase.execute({ ...query, user_id: user.id });

        const response = ApiResponse.success(result, "Tasks retrieved successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        query: ListTasksQuerySchema,
        detail: { 
            tags: ['Tasks'], 
            summary: 'List tasks',
            responses: {
                '200': swaggerSuccess("Tasks retrieved successfully", [{ id: "task-123", title: "Wash clothes", status: "pending" }]),
                ...standardValidationErrors,
                ...standardAuthErrors
            }
        }
    })
    .patch('/:id', async ({ params: { id }, body, user, set }: any) => {
        const result = await updateTaskUseCase.execute({ ...body, id, user_id: user.id });

        const response = ApiResponse.success(result, "Task updated successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        body: UpdateTaskBodySchema,
        detail: {
            tags: ['Tasks'],
            summary: 'Update task title, description, due date or assignee',
            responses: {
                '200': swaggerSuccess("Task updated successfully", { id: "task-123", title: "Wash clothes", due_date: "2026-11-10T16:30:00.000Z" }),
                ...standardValidationErrors,
                '404': customTaskErrors.notFound,
                ...standardAuthErrors
            }
        }
    })
    .patch('/:id/status', async ({ params: { id }, body, user, set }: any) => {
        const result = await updateTaskStatusUseCase.execute({ id, user_id: user.id, status: body.status });

        const response = ApiResponse.success(result, "Task status updated successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        body: UpdateTaskStatusBodySchema,
        detail: { 
            tags: ['Tasks'], 
            summary: 'Update task status',
            responses: {
                '200': swaggerSuccess("Task status updated successfully", { id: "task-123", status: "completed" }),
                ...standardValidationErrors,
                '404': customTaskErrors.notFound,
                ...standardAuthErrors
            }
        }
    })
    .patch('/:id/assign', async ({ params: { id }, body, user, set }: any) => {
        const result = await assignTaskUseCase.execute({ id, user_id: user.id, assignee_id: body.assignee_id });

        const response = ApiResponse.success(result, "Task assigned successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        body: AssignTaskBodySchema,
        detail: { 
            tags: ['Tasks'], 
            summary: 'Assign a task to a user',
            responses: {
                '200': swaggerSuccess("Task assigned successfully", { id: "task-123", assigned_to: "user-123" }),
                ...standardValidationErrors,
                '404': customTaskErrors.notFound,
                ...standardAuthErrors
            }
        }
    })
    .delete('/:id', async ({ params: { id }, user, set }: any) => {
        const result = await deleteTaskUseCase.execute({ id, user_id: user.id });

        const response = ApiResponse.success(result, "Task deleted successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        detail: { 
            tags: ['Tasks'], 
            summary: 'Delete a task',
            responses: {
                '200': swaggerSuccess("Task deleted successfully", { id: "task-123" }),
                ...standardValidationErrors,
                '404': customTaskErrors.notFound,
                ...standardAuthErrors
            }
        }
    });
