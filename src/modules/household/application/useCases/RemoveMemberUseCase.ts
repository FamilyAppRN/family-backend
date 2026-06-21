import { UseCase } from '../../../../shared/application/useCase.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import { RemoveMemberInputSchema, HouseholdSchema } from '../schemas/household.schemas.js';
import { Static } from '@sinclair/typebox';
import { HouseholdNotFoundError, UserNotInHouseholdError, OwnerCannotLeaveError, NotHouseholdAdminError } from '../../domain/errors/HouseholdErrors.js';

type Input = Static<typeof RemoveMemberInputSchema>;
type Output = Static<typeof HouseholdSchema>;

export class RemoveMemberUseCase extends UseCase<any, any> {
    protected inputSchema: any = RemoveMemberInputSchema;
    protected outputSchema: any = HouseholdSchema;

    constructor(private repository: HouseholdRepository) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        const household = await this.repository.findById(data.householdId);

        if (!household) {
            throw new HouseholdNotFoundError();
        }

        const requestingMember = household.members.find(m => m.user_id === data.requestingUserId);
        if (!requestingMember) {
            throw new UserNotInHouseholdError();
        }

        const targetMember = household.members.find(m => m.user_id === data.targetUserId);
        if (!targetMember) {
            throw new UserNotInHouseholdError(); // El usuario que se intenta eliminar no está
        }

        // Si intenta eliminarse a sí mismo (salir del hogar)
        if (data.requestingUserId === data.targetUserId) {
            if (household.admin_id === data.requestingUserId) {
                throw new OwnerCannotLeaveError();
            }
        } else {
            // Si intenta eliminar a otro, debe ser admin
            if (requestingMember.role !== 'admin') {
                throw new NotHouseholdAdminError();
            }
            // Además, no puede eliminar al owner
            if (data.targetUserId === household.admin_id) {
                throw new OwnerCannotLeaveError(); // Reusing error or creating a new one: CannotRemoveOwnerError. OwnerCannotLeaveError is close enough. Let's stick with it or we could throw a general NotHouseholdAdminError since owner is super-admin.
            }
        }

        const updatedHousehold = await this.repository.removeMember(data.householdId, data.targetUserId);

        return updatedHousehold;
    }
}
