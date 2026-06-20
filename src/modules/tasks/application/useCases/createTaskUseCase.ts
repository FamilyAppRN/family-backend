import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { CreateTaskInputSchema, CreateTaskOutputSchema } from '../schemas/tasks.schemas.js';
import { TaskEntity } from '../../domain/entities/TaskEntity.js';

type Input = any;
type Output = any;

export class CreateTaskUseCase extends UseCase<Input, Output> {
    protected inputSchema = CreateTaskInputSchema as any;
    protected outputSchema = CreateTaskOutputSchema as any;

    constructor(private taskRepository: TaskRepository) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const taskData = {
            household_id: data.household_id,
            creator_id: data.creator_id!,
            assignee_id: data.assignee_id || null,
            title: data.title,
            description: data.description || null,
            status: data.status || 'pending',
            due_date: data.due_date ? new Date(data.due_date) : null
        };

        const task = await this.taskRepository.create(taskData);
        return task;
    }
}
