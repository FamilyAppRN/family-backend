import { UseCase } from '../../../../shared/application/useCase.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import { GetUserHouseholdsInputSchema, GetUserHouseholdsOutputSchema } from '../schemas/household.schemas.js';

export class GetUserHouseholdsUseCase extends UseCase<any, any> {
    protected inputSchema = GetUserHouseholdsInputSchema;
    protected outputSchema = GetUserHouseholdsOutputSchema;

    constructor(private householdRepository: HouseholdRepository) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        const households = await this.householdRepository.findByUserId(data.userId);

        return households.map(h => {
            const isOwner = h.admin_id === data.userId;
            const member = h.members.find(m => m.user_id === data.userId);

            return {
                id: h.id,
                name: h.name,
                role: member?.role || 'member',
                is_owner: isOwner,
                invite_code: isOwner ? h.invite_code : null,
                members_count: h.members.length,
            };
        });
    }
}
