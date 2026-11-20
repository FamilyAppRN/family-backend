import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertIsMember } from '../../../household/application/services/HouseholdMembership.js';
import { getAuthorizedTask } from '../services/TaskAuthorization.js';
import { AssignTaskInputSchema, AssignTaskOutputSchema } from '../schemas/tasks.schemas.js';
import { TaskNotFoundError } from '../../domain/errors/TaskNotFoundError.js';

type Input = any;
type Output = any;

export class AssignTaskUseCase extends UseCase<Input, Output> {
    protected inputSchema = AssignTaskInputSchema as any;
    protected outputSchema = AssignTaskOutputSchema as any;

    constructor(private taskRepository: TaskRepository, private getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const { household } = await getAuthorizedTask(this.taskRepository, this.getHouseholdUseCase, data.id, data.user_id);
        assertIsMember(household, data.assignee_id);

        const task = await this.taskRepository.assign(data.id, data.assignee_id);
        if (!task) {
            throw new TaskNotFoundError();
        }
        return task;
    }
}
