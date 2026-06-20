import { ShoppingService } from './shopping.service.js';

export const ShoppingController = {
  async getLists({ params: { householdId } }: any) {
    return await ShoppingService.getLists(householdId);
  },

  async createList({ params: { householdId }, user, body }: any) {
    return await ShoppingService.createList(householdId, user.id, body);
  },

  async addItem({ params: { householdId, listId }, user, body }: any) {
    return await ShoppingService.addItem(householdId, listId, user.id, body);
  },

  async toggleItem({ params: { householdId, listId, itemId }, user, body }: any) {
    return await ShoppingService.toggleItem(householdId, listId, itemId, user.id, body);
  },

  async archiveList({ params: { householdId, listId }, user }: any) {
    return await ShoppingService.archiveList(householdId, listId, user.id);
  }
};
