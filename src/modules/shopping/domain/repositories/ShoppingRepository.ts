import { ShoppingListEntity, ShoppingItemEntity, ShoppingPurchaseHistoryEntity } from '../entities/ShoppingListEntity.js';

export interface ShoppingRepository {
  createList(data: { household_id: string; name: string; created_by: string }): Promise<ShoppingListEntity>;
  getListsByHousehold(householdId: string, status?: 'active' | 'archived'): Promise<ShoppingListEntity[]>;
  getListById(listId: string): Promise<ShoppingListEntity | null>;
  addItemToList(listId: string, item: Omit<ShoppingItemEntity, 'id' | 'is_completed'>): Promise<ShoppingListEntity>;
  toggleItemStatus(listId: string, itemId: string, isCompleted: boolean, userId: string): Promise<ShoppingListEntity>;
  updateList(listId: string, data: Partial<{ name: string }>): Promise<ShoppingListEntity>;
  finalizeList(listId: string, completedBy: string): Promise<{ history: ShoppingPurchaseHistoryEntity; active_list: ShoppingListEntity }>;
  getHistoryByHousehold(householdId: string): Promise<ShoppingPurchaseHistoryEntity[]>;
  deleteList(listId: string): Promise<void>;
}
