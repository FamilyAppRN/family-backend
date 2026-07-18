import { Elysia } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';

import { MongooseTaskRepository } from '../persistence/MongooseTaskRepository.js';
import { CreateTaskUseCase } from '../../application/useCases/createTaskUseCase.js';
import { ListTasksUseCase } from '../../application/useCases/listTasksUseCase.js';
import { UpdateTaskStatusUseCase } from '../../application/useCases/updateTaskStatusUseCase.js';
import { AssignTaskUseCase } from '../../application/useCases/assignTaskUseCase.js';
import { DeleteTaskUseCase } from '../../application/useCases/deleteTaskUseCase.js';
import {
    CreateTaskInputSchema,
    ListTasksInputSchema,
    UpdateTaskStatusInputSchema,
    AssignTaskInputSchema,
    DeleteTaskInputSchema
} from '../../application/schemas/tasks.schemas.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { swaggerSuccess, standardAuthErrors, standardValidationErrors, standardNotFoundErrors, customTaskErrors } from '../../../../shared/infrastructure/http/swaggerResponses.js';

export const tasksRoutes = new Elysia({ prefix: '/tasks' })
    .use(authMiddleware)
    .post('/', async ({ body, user, set }: any) => {
        const repo = new MongooseTaskRepository();
        const useCase = new CreateTaskUseCase(repo);

        const result = await useCase.execute({
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
    .get('/', async ({ query, set }) => {
        const repo = new MongooseTaskRepository();
        const useCase = new ListTasksUseCase(repo);

        const result = await useCase.execute(query);

        const response = ApiResponse.success(result, "Tasks retrieved successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        query: ListTasksInputSchema,
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
    .patch('/:id/status', async ({ params: { id }, body, set }) => {
        const repo = new MongooseTaskRepository();
        const useCase = new UpdateTaskStatusUseCase(repo);

        const result = await useCase.execute({ id, ...(body as any) });

        const response = ApiResponse.success(result, "Task status updated successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        body: UpdateTaskStatusInputSchema,
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
    .patch('/:id/assign', async ({ params: { id }, body, set }) => {
        const repo = new MongooseTaskRepository();
        const useCase = new AssignTaskUseCase(repo);

        const result = await useCase.execute({ id, ...(body as any) });

        const response = ApiResponse.success(result, "Task assigned successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        body: AssignTaskInputSchema,
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
    .delete('/:id', async ({ params: { id }, set }) => {
        const repo = new MongooseTaskRepository();
        const useCase = new DeleteTaskUseCase(repo);

        const result = await useCase.execute({ id });

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
