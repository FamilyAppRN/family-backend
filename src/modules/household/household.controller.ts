import { HouseholdService } from './household.service.js';

export const HouseholdController = {
  async createHousehold({ user, body }: any) {
    return await HouseholdService.createHousehold(user.id, body);
  },

  async joinHousehold({ user, body }: any) {
    return await HouseholdService.joinHousehold(user.id, body);
  },

  async getMembers({ params: { householdId } }: any) {
    return await HouseholdService.getMembers(householdId);
  },

  async getHousehold({ params: { householdId } }: any) {
    return await HouseholdService.getHousehold(householdId);
  }
};
