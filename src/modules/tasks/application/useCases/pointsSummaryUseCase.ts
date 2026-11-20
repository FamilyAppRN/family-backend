import { UseCase } from '../../../../shared/application/useCase.js';
import { ApplicationError } from '../../../../shared/domain/error.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership } from '../../../household/application/services/HouseholdMembership.js';
import { PointsSummaryInputSchema, PointsSummaryOutputSchema } from '../schemas/tasks.schemas.js';

type Input = any;
type Output = any;

/** Puntos acumulados por miembro: suma de sus tareas completadas con puntos. */
export class PointsSummaryUseCase extends UseCase<Input, Output> {
    protected inputSchema = PointsSummaryInputSchema as any;
    protected outputSchema = PointsSummaryOutputSchema as any;

    constructor(private taskRepository: TaskRepository, private getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        await assertHouseholdMembership(this.getHouseholdUseCase, data.household_id, data.user_id);
        let since: Date | undefined;
        if (data.from) {
            since = new Date(data.from);
            if (Number.isNaN(since.getTime())) {
                throw new ApplicationError(400, 'La fecha "from" no es válida', 'VALIDATION_ERROR', 'VALIDATION');
            }
        }
        return this.taskRepository.sumPointsByAssignee(data.household_id, since);
    }
}
