import { t } from 'elysia';

// Define enums for the status
export const TaskStatusSchema = t.Union([
    t.Literal('pending'),
    t.Literal('in_progress'),
    t.Literal('completed')
]);

export const TaskSchema = t.Object({
    id: t.String(),
    household_id: t.String(),
    creator_id: t.String(),
    assignee_id: t.Optional(t.Union([t.String(), t.Null()])),
    title: t.String(),
    description: t.Optional(t.Union([t.String(), t.Null()])),
    status: TaskStatusSchema,
    due_date: t.Optional(t.Union([t.Any(), t.Null()])), // Assuming it will be parsed as Date or string
    created_at: t.Any(),
    updated_at: t.Any()
});

export const CreateTaskInputSchema = t.Object({
    household_id: t.String(),
    creator_id: t.Optional(t.String()), // Optional since it is provided by the token in the route
    assignee_id: t.Optional(t.String()),
    title: t.String({ minLength: 1 }),
    description: t.Optional(t.String()),
    due_date: t.Optional(t.Any()),
    status: t.Optional(TaskStatusSchema)
});

export const CreateTaskOutputSchema = TaskSchema;

export const ListTasksInputSchema = t.Object({
    household_id: t.String(),
    status: t.Optional(TaskStatusSchema),
    assignee_id: t.Optional(t.String())
});

export const ListTasksOutputSchema = t.Array(TaskSchema);

export const UpdateTaskStatusInputSchema = t.Object({
    id: t.String(),
    status: TaskStatusSchema
});

export const UpdateTaskStatusOutputSchema = TaskSchema;

export const AssignTaskInputSchema = t.Object({
    id: t.String(),
    assignee_id: t.String()
});

export const AssignTaskOutputSchema = TaskSchema;

export const DeleteTaskInputSchema = t.Object({
    id: t.String()
});

export const DeleteTaskOutputSchema = t.Object({
    success: t.Boolean()
});
