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
        const { task: current, household } = await getAuthorizedTask(this.taskRepository, this.getHouseholdUseCase, data.id, data.user_id);
        const role = household.members.find((m) => m.user_id === data.user_id)?.role;

        // Un niño no se da los puntos solo: su tarea con puntos queda por verificar.
        let status = data.status;
        if (role === 'kid' && status === 'completed' && (current.points ?? 0) > 0) status = 'waiting_verification';
        // Y "por verificar" solo lo genera ese flujo, no se pide a mano.
        if (status === 'waiting_verification' && role !== 'kid') status = 'completed';

        const task = await this.taskRepository.updateStatus(data.id, status);
        if (!task) {
            throw new TaskNotFoundError();
        }
        return task;
    }
}
