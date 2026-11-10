export interface ShoppingItemEntity {
  id: string;
  name: string;
  quantity: number;
  unit?: string | null;
  category?: string;
  is_urgent?: boolean;
  is_completed: boolean;
  added_by: string;
  checked_by?: string | null;
}

export interface ShoppingListEntity {
  id: string;
  household_id: string;
  name: string;
  status: 'active' | 'archived';
  items: ShoppingItemEntity[];
  history: ShoppingPurchaseHistoryEntity[];
  created_by: string;
  created_at: Date;
}

export interface ShoppingPurchaseHistoryEntity {
  id: string;
  items: ShoppingItemEntity[];
  completed_at: Date;
  completed_by: string;
}
