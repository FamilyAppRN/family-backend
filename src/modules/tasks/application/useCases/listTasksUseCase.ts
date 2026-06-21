import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { ListTasksInputSchema, ListTasksOutputSchema } from '../schemas/tasks.schemas.js';
import { TaskEntity } from '../../domain/entities/TaskEntity.js';

type Input = any;
type Output = any;

export class ListTasksUseCase extends UseCase<Input, Output> {
    protected inputSchema = ListTasksInputSchema as any;
    protected outputSchema = ListTasksOutputSchema as any;

    constructor(private taskRepository: TaskRepository) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const filters: { status?: TaskEntity['status'], assignee_id?: string } = {};
        if (data.status) filters.status = data.status;
        if (data.assignee_id) filters.assignee_id = data.assignee_id;

        const tasks = await this.taskRepository.findByHousehold(data.household_id, filters);
        return tasks;
    }
}
