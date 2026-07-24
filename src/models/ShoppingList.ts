import { Schema, model, Document, Types } from 'mongoose';

export interface IShoppingItem {
  _id: Types.ObjectId;
  name: string;
  qty: number;
  unit: string | null;
  category: string;
  checked: boolean;
  added_by: Types.ObjectId;
  checked_by: Types.ObjectId | null;
  added_at: Date;
}

export interface IShoppingList extends Document {
  _id: Types.ObjectId;
  household_id: Types.ObjectId;
  name: string;
  status: 'active' | 'archived';
  items: IShoppingItem[];
  history: IShoppingPurchaseHistory[];
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

export interface IShoppingPurchaseHistory {
  _id: Types.ObjectId;
  items: IShoppingItem[];
  completed_at: Date;
  completed_by: Types.ObjectId;
}

const shoppingItemSchema = new Schema<IShoppingItem>({
  _id: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
  name: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  unit: { type: String, default: null },
  category: { type: String, required: true },
  checked: { type: Boolean, default: false },
  added_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  checked_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  added_at: { type: Date, default: Date.now }
});

const shoppingPurchaseHistorySchema = new Schema<IShoppingPurchaseHistory>({
  items: { type: [shoppingItemSchema], required: true },
  completed_at: { type: Date, required: true },
  completed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const shoppingListSchema = new Schema<IShoppingList>({
  household_id: { type: Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  items: [shoppingItemSchema],
  history: { type: [shoppingPurchaseHistorySchema], default: [] },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// index for querying active list of household
shoppingListSchema.index({ household_id: 1, status: 1 });
// MongoDB enforces the one-active-list business invariant, including concurrent requests.
shoppingListSchema.index(
  { household_id: 1 },
  { unique: true, partialFilterExpression: { status: 'active' }, name: 'one_active_list_per_household' }
);

export const ShoppingList = model<IShoppingList>('ShoppingList', shoppingListSchema);
