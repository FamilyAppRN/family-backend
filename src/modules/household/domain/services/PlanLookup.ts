import type { Plan } from '../planPolicy.js';

export interface PlanLookup {
  /** Plan vigente del usuario (ya considera el vencimiento). */
  planOf(userId: string): Promise<Plan>;
}
