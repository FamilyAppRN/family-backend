import { UseCase } from '../../../../shared/application/useCase.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import { AddMemberInputSchema, HouseholdSchema } from '../schemas/household.schemas.js';
import { Static } from '@sinclair/typebox';
import { InvalidInviteCodeError, UserAlreadyInHouseholdError } from '../../domain/errors/HouseholdErrors.js';

type Input = Static<typeof AddMemberInputSchema>;
type Output = Static<typeof HouseholdSchema>;

export class AddMemberUseCase extends UseCase<any, any> {
    protected inputSchema: any = AddMemberInputSchema;
    protected outputSchema: any = HouseholdSchema;

    constructor(private repository: HouseholdRepository) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const household = await this.repository.findByInviteCode(data.inviteCode);

        if (!household) {
            throw new InvalidInviteCodeError();
        }

        const isMember = household.members.some(member => member.user_id === data.userId);
        if (isMember) {
            throw new UserAlreadyInHouseholdError();
        }

        const newMember = {
            user_id: data.userId,
            role: 'member' as const,
            display_name: data.userName,
            joined_at: new Date()
        };

        const updatedHousehold = await this.repository.addMember(household.id, newMember);

        return updatedHousehold;
    }
}
