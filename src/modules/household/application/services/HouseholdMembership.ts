import { GetHouseholdUseCase } from '../useCases/GetHouseholdUseCase.js';
import { HouseholdEntity, HouseholdMemberEntity } from '../../domain/entities/HouseholdEntity.js';
import { PlanRequiredError, UserNotInHouseholdError } from '../../domain/errors/HouseholdErrors.js';
import type { PlanLookup } from '../../domain/services/PlanLookup.js';

/**
 * Throws unless `userId` belongs to the household. Returns the household so
 * callers can check roles or other members without a second query.
 */
export async function assertHouseholdMembership(
  getHouseholdUseCase: GetHouseholdUseCase,
  householdId: string,
  userId: string,
): Promise<HouseholdEntity> {
  return (await getHouseholdUseCase.execute({ householdId, userId })) as HouseholdEntity;
}

export function findMember(household: HouseholdEntity, userId: string): HouseholdMemberEntity | undefined {
  return household.members.find((member) => member.user_id === userId);
}

export function isHouseholdAdmin(household: HouseholdEntity, userId: string): boolean {
  return findMember(household, userId)?.role === 'admin';
}

/** Throws unless `userId` is a member of the given household (e.g. a task assignee). */
export function assertIsMember(household: HouseholdEntity, userId: string): void {
  if (!findMember(household, userId)) {
    throw new UserNotInHouseholdError();
  }
}

/**
 * Funciones Premium (calendario, puntos): el hogar es Premium si su dueño lo
 * es, y entonces lo disfrutan todos sus miembros.
 */
export async function assertPremiumHousehold(household: HouseholdEntity, planLookup: PlanLookup): Promise<void> {
  if ((await planLookup.planOf(household.admin_id)) !== 'premium') {
    throw new PlanRequiredError();
  }
}
