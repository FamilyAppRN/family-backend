import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { getAuthorizedTask } from '../services/TaskAuthorization.js';
import { DeleteTaskInputSchema, DeleteTaskOutputSchema } from '../schemas/tasks.schemas.js';
import { TaskNotFoundError } from '../../domain/errors/TaskNotFoundError.js';

type Input = any;
type Output = any;

export class DeleteTaskUseCase extends UseCase<Input, Output> {
    protected inputSchema = DeleteTaskInputSchema as any;
    protected outputSchema = DeleteTaskOutputSchema as any;

    constructor(private taskRepository: TaskRepository, private getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        await getAuthorizedTask(this.taskRepository, this.getHouseholdUseCase, data.id, data.user_id);

        const deleted = await this.taskRepository.delete(data.id);
        if (!deleted) {
            throw new TaskNotFoundError();
        }
        return { success: true };
    }
}
