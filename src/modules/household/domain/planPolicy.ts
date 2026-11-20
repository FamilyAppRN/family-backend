import {
  HouseholdFullError,
  LimitReachedCreateHouseholdError,
  LimitReachedJoinHouseholdError,
} from './errors/HouseholdErrors.js';

/**
 * Límites por plan (reglas-para-unirse-familias.md). Premium es del hogar
 * según su dueño: el plan del dueño decide cuántos miembros caben y si el
 * hogar tiene calendario y puntos. Cuántos hogares crea o integra cada
 * persona depende de su propio plan.
 */
export const PLAN_LIMITS = {
  free: { ownedHouseholds: 1, totalHouseholds: 2, membersPerHousehold: 4 },
  premium: { ownedHouseholds: 10, totalHouseholds: Infinity, membersPerHousehold: 15 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

/**
 * Plan vigente: 'premium' solo si no venció. Sin fecha de vencimiento se
 * considera vigente (de por vida o gestionado a mano).
 */
export function effectivePlan(plan?: string | null, expiresAt?: Date | string | null, now = new Date()): Plan {
  if (plan !== 'premium') return 'free';
  if (!expiresAt) return 'premium';
  return new Date(expiresAt).getTime() > now.getTime() ? 'premium' : 'free';
}

/**
 * Al bajar a gratis no se borra nada (política de no destrucción): estos
 * chequeos solo frenan crear o sumar más de lo que permite el plan.
 */
export function assertCanCreateHousehold(plan: Plan, ownedHouseholds: number): void {
  if (ownedHouseholds >= PLAN_LIMITS[plan].ownedHouseholds) throw new LimitReachedCreateHouseholdError();
}

export function assertCanJoinHousehold(plan: Plan, totalHouseholds: number): void {
  if (totalHouseholds >= PLAN_LIMITS[plan].totalHouseholds) throw new LimitReachedJoinHouseholdError();
}

/** El hogar destino tiene lugar según el plan de su dueño, aunque quien entra sea Premium. */
export function assertHouseholdHasRoom(ownerPlan: Plan, membersCount: number): void {
  if (membersCount >= PLAN_LIMITS[ownerPlan].membersPerHousehold) throw new HouseholdFullError();
}
