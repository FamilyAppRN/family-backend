export interface ShoppingItemEntity {
  id: string;
  name: string;
  quantity: number;
  is_completed: boolean;
  added_by: string;
}

export interface ShoppingListEntity {
  id: string;
  household_id: string;
  name: string;
  items: ShoppingItemEntity[];
  created_by: string;
  created_at: Date;
}
