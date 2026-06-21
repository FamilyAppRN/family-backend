import { UseCase } from '../../../../shared/application/useCase.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import { GetHouseholdInputSchema, HouseholdSchema } from '../schemas/household.schemas.js';
import { Static } from '@sinclair/typebox';
import { HouseholdNotFoundError, UserNotInHouseholdError } from '../../domain/errors/HouseholdErrors.js';

type Input = Static<typeof GetHouseholdInputSchema>;
type Output = Static<typeof HouseholdSchema>;

export class GetHouseholdUseCase extends UseCase<any, any> {
    protected inputSchema: any = GetHouseholdInputSchema;
    protected outputSchema: any = HouseholdSchema;

    constructor(private repository: HouseholdRepository) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const household = await this.repository.findById(data.householdId);

        if (!household) {
            throw new HouseholdNotFoundError();
        }

        const isMember = household.members.some(member => member.user_id === data.userId);
        if (!isMember) {
            throw new UserNotInHouseholdError();
        }

        return household;
    }
}
