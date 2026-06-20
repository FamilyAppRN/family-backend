import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { UpdateTaskStatusInputSchema, UpdateTaskStatusOutputSchema } from '../schemas/tasks.schemas.js';
import { TaskEntity } from '../../domain/entities/TaskEntity.js';
import { TaskNotFoundError } from '../../domain/errors/TaskNotFoundError.js';

type Input = any;
type Output = any;

export class UpdateTaskStatusUseCase extends UseCase<Input, Output> {
    protected inputSchema = UpdateTaskStatusInputSchema as any;
    protected outputSchema = UpdateTaskStatusOutputSchema as any;

    constructor(private taskRepository: TaskRepository) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const task = await this.taskRepository.updateStatus(data.id, data.status);
        if (!task) {
            throw new TaskNotFoundError();
        }
        return task;
    }
}
