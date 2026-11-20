import { UseCase } from '../../../../shared/application/useCase.js';
import { ApplicationError } from '../../../../shared/domain/error.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { isHouseholdAdmin } from '../../../household/application/services/HouseholdMembership.js';
import { NotHouseholdAdminError } from '../../../household/domain/errors/HouseholdErrors.js';
import { getAuthorizedTask } from '../services/TaskAuthorization.js';
import { TaskNotFoundError } from '../../domain/errors/TaskNotFoundError.js';
import { TaskSchema, VerifyTaskInputSchema } from '../schemas/tasks.schemas.js';

type Input = any;
type Output = any;

/** Un admin aprueba (suma los puntos) o devuelve a pendiente una tarea que marcó un niño. */
export class VerifyTaskUseCase extends UseCase<Input, Output> {
    protected inputSchema = VerifyTaskInputSchema as any;
    protected outputSchema = TaskSchema as any;

    constructor(private taskRepository: TaskRepository, private getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const { task, household } = await getAuthorizedTask(this.taskRepository, this.getHouseholdUseCase, data.id, data.user_id);
        if (!isHouseholdAdmin(household, data.user_id)) throw new NotHouseholdAdminError();
        if (task.status !== 'waiting_verification') {
            throw new ApplicationError(409, 'La tarea no está esperando verificación', 'TASK_NOT_WAITING_VERIFICATION', 'CONFLICT');
        }
        const updated = await this.taskRepository.updateStatus(data.id, data.approve ? 'completed' : 'pending');
        if (!updated) throw new TaskNotFoundError();
        return updated;
    }
}
