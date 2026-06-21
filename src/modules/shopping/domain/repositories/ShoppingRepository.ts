import { ShoppingListEntity, ShoppingItemEntity } from '../entities/ShoppingListEntity.js';

export interface ShoppingRepository {
  createList(data: { household_id: string; name: string; created_by: string }): Promise<ShoppingListEntity>;
  getListsByHousehold(householdId: string): Promise<ShoppingListEntity[]>;
  addItemToList(listId: string, item: Omit<ShoppingItemEntity, 'id' | 'is_completed'>): Promise<ShoppingListEntity>;
  toggleItemStatus(listId: string, itemId: string, isCompleted: boolean): Promise<ShoppingListEntity>;
  deleteList(listId: string): Promise<void>;
}
