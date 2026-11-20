import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership } from '../../../household/application/services/HouseholdMembership.js';
import { ListTasksInputSchema, ListTasksOutputSchema } from '../schemas/tasks.schemas.js';
import { TaskEntity } from '../../domain/entities/TaskEntity.js';

type Input = any;
type Output = any;

export class ListTasksUseCase extends UseCase<Input, Output> {
    protected inputSchema = ListTasksInputSchema as any;
    protected outputSchema = ListTasksOutputSchema as any;

    constructor(private taskRepository: TaskRepository, private getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        await assertHouseholdMembership(this.getHouseholdUseCase, data.household_id, data.user_id);

        const filters: { status?: TaskEntity['status'], assignee_id?: string } = {};
        if (data.status) filters.status = data.status;
        if (data.assignee_id) filters.assignee_id = data.assignee_id;

        return this.taskRepository.findByHousehold(data.household_id, filters);
    }
}
