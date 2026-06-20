export class ShoppingService {
  static async getLists(householdId: string): Promise<any> {
    return { message: 'Get lists active', householdId, lists: [] };
  }

  static async createList(householdId: string, userId: string, body: any): Promise<any> {
    return { message: 'Create list active', householdId, createdBy: userId, data: body };
  }

  static async addItem(householdId: string, listId: string, userId: string, body: any): Promise<any> {
    return { message: 'Add item active', householdId, listId, addedBy: userId, item: body };
  }

  static async toggleItem(householdId: string, listId: string, itemId: string, userId: string, body: any): Promise<any> {
    return { message: 'Toggle item active', householdId, listId, itemId, toggledBy: userId, data: body };
  }

  static async archiveList(householdId: string, listId: string, userId: string): Promise<any> {
    return { message: 'Archive list active', householdId, listId, archivedBy: userId };
  }
}
