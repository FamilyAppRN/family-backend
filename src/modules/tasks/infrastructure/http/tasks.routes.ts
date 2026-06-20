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
        detail: { tags: ['Tasks'], summary: 'Create a new task' }
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
        detail: { tags: ['Tasks'], summary: 'List tasks' }
    })
    .patch('/:id/status', async ({ params: { id }, body, set }) => {
        const repo = new MongooseTaskRepository();
        const useCase = new UpdateTaskStatusUseCase(repo);

        const result = await useCase.execute({ id, ...(body as any) });

        const response = ApiResponse.success(result, "Task status updated successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        detail: { tags: ['Tasks'], summary: 'Update task status' }
    })
    .patch('/:id/assign', async ({ params: { id }, body, set }) => {
        const repo = new MongooseTaskRepository();
        const useCase = new AssignTaskUseCase(repo);

        const result = await useCase.execute({ id, ...(body as any) });

        const response = ApiResponse.success(result, "Task assigned successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        detail: { tags: ['Tasks'], summary: 'Assign a task to a user' }
    })
    .delete('/:id', async ({ params: { id }, set }) => {
        const repo = new MongooseTaskRepository();
        const useCase = new DeleteTaskUseCase(repo);

        const result = await useCase.execute({ id });

        const response = ApiResponse.success(result, "Task deleted successfully", 200);
        set.status = response.status;
        return response.body;
    }, {
        detail: { tags: ['Tasks'], summary: 'Delete a task' }
    });
