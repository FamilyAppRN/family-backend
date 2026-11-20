import { UseCase } from '../../../../shared/application/useCase.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import { AddMemberInputSchema, HouseholdSchema } from '../schemas/household.schemas.js';
import { Static } from '@sinclair/typebox';
import { InvalidInviteCodeError, UserAlreadyInHouseholdError } from '../../domain/errors/HouseholdErrors.js';
import { assertCanJoinHousehold, assertHouseholdHasRoom } from '../../domain/planPolicy.js';
import type { PlanLookup } from '../../domain/services/PlanLookup.js';

type Input = Static<typeof AddMemberInputSchema>;
type Output = Static<typeof HouseholdSchema>;

export class AddMemberUseCase extends UseCase<any, any> {
    protected inputSchema: any = AddMemberInputSchema;
    protected outputSchema: any = HouseholdSchema;

    constructor(private repository: HouseholdRepository, private planLookup: PlanLookup) {
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

        // Quien entra: su plan limita en cuántos hogares puede estar.
        const myHouseholds = await this.repository.findByUserId(data.userId);
        assertCanJoinHousehold(data.plan ?? 'free', myHouseholds.length);

        // El hogar: el plan de su dueño limita cuántos miembros caben.
        const ownerPlan = await this.planLookup.planOf(household.admin_id);
        assertHouseholdHasRoom(ownerPlan, household.members.length);

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
