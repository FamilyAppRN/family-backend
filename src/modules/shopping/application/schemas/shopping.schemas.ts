import { Type, Static } from '@sinclair/typebox';

export const ShoppingItemSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  quantity: Type.Number(),
  is_completed: Type.Boolean(),
  added_by: Type.String(),
  checked_by: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const ShoppingListSchema = Type.Object({
  id: Type.String(),
  household_id: Type.String(),
  name: Type.String(),
  status: Type.Union([Type.Literal('active'), Type.Literal('archived')]),
  items: Type.Array(ShoppingItemSchema),
  created_by: Type.String(),
  created_at: Type.Any(), // Can be Date or string depending on serialization
});

export const CreateShoppingListInput = Type.Object({
  household_id: Type.String(),
  name: Type.String(),
  created_by: Type.String(), // This will be injected from the auth context
});

export const UpdateShoppingListInput = Type.Object({
  list_id: Type.String(),
  name: Type.Optional(Type.String()),
  status: Type.Optional(Type.Union([Type.Literal('active'), Type.Literal('archived')])),
});

export const GetShoppingListsInput = Type.Object({
  household_id: Type.String(),
  status: Type.Optional(Type.Union([Type.Literal('active'), Type.Literal('archived')])),
});

export const AddItemToListInput = Type.Object({
  list_id: Type.String(),
  name: Type.String(),
  quantity: Type.Number({ minimum: 1, default: 1 }),
  added_by: Type.String(), // This will be injected from auth
});

export const ToggleItemStatusInput = Type.Object({
  list_id: Type.String(),
  item_id: Type.String(),
  is_completed: Type.Boolean(),
  userId: Type.String(),
});

export const DeleteShoppingListInput = Type.Object({
  list_id: Type.String(),
});

export type TShoppingItem = Static<typeof ShoppingItemSchema>;
export type TShoppingList = Static<typeof ShoppingListSchema>;
