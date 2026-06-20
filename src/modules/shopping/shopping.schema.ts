import { t } from 'elysia';

export const createListSchema = t.Object({
  name: t.String({ minLength: 2 }),
});

export const addItemSchema = t.Object({
  name: t.String({ minLength: 1 }),
  qty: t.Number({ minimum: 1 }),
  unit: t.Optional(t.Union([t.String(), t.Null()])),
  category: t.String({ minLength: 1 }),
});

export const toggleItemSchema = t.Object({
  checked: t.Boolean(),
});
