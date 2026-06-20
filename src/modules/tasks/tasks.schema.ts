import { t } from 'elysia';

export const createTaskSchema = t.Object({
  title: t.String({ minLength: 2 }),
  description: t.Optional(t.Union([t.String(), t.Null()])),
  assigned_to: t.Optional(t.Union([t.String(), t.Null()])),
  due_date: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
  points: t.Optional(t.Number({ minimum: 0 })),
  reward_label: t.Optional(t.Union([t.String(), t.Null()])),
});

export const updateTaskStatusSchema = t.Object({
  status: t.Union([t.Literal('pending'), t.Literal('done')]),
});

export const updateTaskSchema = t.Partial(createTaskSchema);
export const claimPointsSchema = t.Object({});
