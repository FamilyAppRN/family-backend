import { Static } from '@sinclair/typebox';
import { UseCase } from '../../../../shared/application/useCase.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import {
  HouseholdNotFoundError,
  NotHouseholdAdminError,
  OwnerCannotLeaveError,
  UserNotInHouseholdError,
} from '../../domain/errors/HouseholdErrors.js';
import type { PlanLookup } from '../../domain/services/PlanLookup.js';
import { assertPremiumHousehold } from '../services/HouseholdMembership.js';
import { ChangeMemberRoleInputSchema, HouseholdSchema } from '../schemas/household.schemas.js';

type Input = Static<typeof ChangeMemberRoleInputSchema>;
type Output = Static<typeof HouseholdSchema>;

/**
 * Un admin cambia el rol de otro miembro: Admin, Miembro o Niño. El dueño no
 * cambia de rol. "Niño" solo existe para los puntos, así que pide Premium.
 */
export class ChangeMemberRoleUseCase extends UseCase<Input, Output> {
  protected inputSchema = ChangeMemberRoleInputSchema;
  protected outputSchema = HouseholdSchema;

  constructor(private repository: HouseholdRepository, private planLookup: PlanLookup) {
    super();
  }

  protected async implementation(data: Input): Promise<Output> {
    const household = await this.repository.findById(data.householdId);
    if (!household) throw new HouseholdNotFoundError();

    const requester = household.members.find((m) => m.user_id === data.requestingUserId);
    if (!requester || requester.role !== 'admin') throw new NotHouseholdAdminError();
    if (!household.members.some((m) => m.user_id === data.targetUserId)) throw new UserNotInHouseholdError();
    if (data.targetUserId === household.admin_id) throw new OwnerCannotLeaveError();
    if (data.role === 'kid') await assertPremiumHousehold(household, this.planLookup);

    return this.repository.setMemberRole(data.householdId, data.targetUserId, data.role);
  }
}
