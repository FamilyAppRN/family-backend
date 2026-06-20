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
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
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

const shoppingListSchema = new Schema<IShoppingList>({
  household_id: { type: Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  items: [shoppingItemSchema],
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// index for querying active list of household
shoppingListSchema.index({ household_id: 1, status: 1 });

export const ShoppingList = model<IShoppingList>('ShoppingList', shoppingListSchema);
