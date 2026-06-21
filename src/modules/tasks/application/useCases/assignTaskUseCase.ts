import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { AssignTaskInputSchema, AssignTaskOutputSchema } from '../schemas/tasks.schemas.js';
import { TaskEntity } from '../../domain/entities/TaskEntity.js';
import { TaskNotFoundError } from '../../domain/errors/TaskNotFoundError.js';

type Input = any;
type Output = any;

export class AssignTaskUseCase extends UseCase<Input, Output> {
    protected inputSchema = AssignTaskInputSchema as any;
    protected outputSchema = AssignTaskOutputSchema as any;

    constructor(private taskRepository: TaskRepository) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const task = await this.taskRepository.assign(data.id, data.assignee_id);
        if (!task) {
            throw new TaskNotFoundError();
        }
        return task;
    }
}
