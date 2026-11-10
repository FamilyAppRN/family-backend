import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { getAuthorizedTask } from '../services/TaskAuthorization.js';
import { UpdateTaskStatusInputSchema, UpdateTaskStatusOutputSchema } from '../schemas/tasks.schemas.js';
import { TaskNotFoundError } from '../../domain/errors/TaskNotFoundError.js';

type Input = any;
type Output = any;

export class UpdateTaskStatusUseCase extends UseCase<Input, Output> {
    protected inputSchema = UpdateTaskStatusInputSchema as any;
    protected outputSchema = UpdateTaskStatusOutputSchema as any;

    constructor(private taskRepository: TaskRepository, private getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        await getAuthorizedTask(this.taskRepository, this.getHouseholdUseCase, data.id, data.user_id);

        const task = await this.taskRepository.updateStatus(data.id, data.status);
        if (!task) {
            throw new TaskNotFoundError();
        }
        return task;
    }
}
