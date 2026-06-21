import { UseCase } from '../../../../shared/application/useCase.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import { UpdateHouseholdInputSchema, HouseholdSchema } from '../schemas/household.schemas.js';
import { Static } from '@sinclair/typebox';
import { HouseholdNotFoundError, NotHouseholdAdminError } from '../../domain/errors/HouseholdErrors.js';

type Input = Static<typeof UpdateHouseholdInputSchema>;
type Output = Static<typeof HouseholdSchema>;

export class UpdateHouseholdUseCase extends UseCase<any, any> {
    protected inputSchema: any = UpdateHouseholdInputSchema;
    protected outputSchema: any = HouseholdSchema;

    constructor(private repository: HouseholdRepository) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const household = await this.repository.findById(data.householdId);

        if (!household) {
            throw new HouseholdNotFoundError();
        }

        const member = household.members.find(m => m.user_id === data.userId);
        if (!member || member.role !== 'admin') {
            throw new NotHouseholdAdminError();
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.settings !== undefined) updateData.settings = data.settings;

        const updatedHousehold = await this.repository.update(data.householdId, updateData);

        return updatedHousehold;
    }
}
