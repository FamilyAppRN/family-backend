import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { TaskEntity } from '../../domain/entities/TaskEntity.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertIsMember } from '../../../household/application/services/HouseholdMembership.js';
import { getAuthorizedTask } from '../services/TaskAuthorization.js';
import { UpdateTaskInputSchema, UpdateTaskOutputSchema } from '../schemas/tasks.schemas.js';
import { TaskNotFoundError } from '../../domain/errors/TaskNotFoundError.js';

type Input = any;
type Output = any;

/** Edits title, description, due date or assignee. A null clears the field. */
export class UpdateTaskUseCase extends UseCase<Input, Output> {
    protected inputSchema = UpdateTaskInputSchema as any;
    protected outputSchema = UpdateTaskOutputSchema as any;

    constructor(private taskRepository: TaskRepository, private getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const { household } = await getAuthorizedTask(this.taskRepository, this.getHouseholdUseCase, data.id, data.user_id);

        const changes: Partial<Pick<TaskEntity, 'title' | 'description' | 'due_date' | 'assignee_id'>> = {};
        if (data.title !== undefined) changes.title = data.title;
        if (data.description !== undefined) changes.description = data.description || null;
        if (data.due_date !== undefined) changes.due_date = data.due_date ? new Date(data.due_date) : null;
        if (data.assignee_id !== undefined) {
            if (data.assignee_id) assertIsMember(household, data.assignee_id);
            changes.assignee_id = data.assignee_id || null;
        }

        const task = await this.taskRepository.update(data.id, changes);
        if (!task) {
            throw new TaskNotFoundError();
        }
        return task;
    }
}
