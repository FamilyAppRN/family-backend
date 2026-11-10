import { UseCase } from '../../../../shared/application/useCase.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership, assertIsMember } from '../../../household/application/services/HouseholdMembership.js';
import { CreateTaskInputSchema, CreateTaskOutputSchema } from '../schemas/tasks.schemas.js';

type Input = any;
type Output = any;

export class CreateTaskUseCase extends UseCase<Input, Output> {
    protected inputSchema = CreateTaskInputSchema as any;
    protected outputSchema = CreateTaskOutputSchema as any;

    constructor(private taskRepository: TaskRepository, private getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const household = await assertHouseholdMembership(this.getHouseholdUseCase, data.household_id, data.creator_id);
        if (data.assignee_id) {
            assertIsMember(household, data.assignee_id);
        }

        return this.taskRepository.create({
            household_id: data.household_id,
            creator_id: data.creator_id,
            assignee_id: data.assignee_id || null,
            title: data.title,
            description: data.description || null,
            status: data.status || 'pending',
            due_date: data.due_date ? new Date(data.due_date) : null
        });
    }
}
