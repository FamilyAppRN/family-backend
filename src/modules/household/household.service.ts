export class HouseholdService {
  static async createHousehold(userId: string, body: any): Promise<any> {
    return { message: 'Create household active', ownerId: userId, data: body };
  }

  static async joinHousehold(userId: string, body: any): Promise<any> {
    return { message: 'Join household active', userId, data: body };
  }

  static async getMembers(householdId: string): Promise<any> {
    return { message: 'Get members active', householdId, members: [] };
  }

  static async getHousehold(householdId: string): Promise<any> {
    return { message: 'Get household details active', householdId };
  }
}
