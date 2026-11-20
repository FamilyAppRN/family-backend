import { User } from '../../../../models/User.js';
import { effectivePlan, type Plan } from '../../domain/planPolicy.js';
import type { PlanLookup } from '../../domain/services/PlanLookup.js';

export class MongoosePlanLookup implements PlanLookup {
  async planOf(userId: string): Promise<Plan> {
    const user = await User.findById(userId, { plan: 1, plan_expires_at: 1 }).lean();
    return effectivePlan(user?.plan, user?.plan_expires_at);
  }
}
