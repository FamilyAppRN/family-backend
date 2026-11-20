import { t } from 'elysia';

// Define enums for the status
export const TaskStatusSchema = t.Union([
    t.Literal('pending'),
    t.Literal('in_progress'),
    t.Literal('waiting_verification'),
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
    points: t.Optional(t.Number()),
    completed_at: t.Optional(t.Union([t.Any(), t.Null()])),
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
    status: t.Optional(TaskStatusSchema),
    /** Solo en hogares Premium. */
    points: t.Optional(t.Integer({ minimum: 0, maximum: 1000 }))
});

export const CreateTaskOutputSchema = TaskSchema;

export const ListTasksQuerySchema = t.Object({
    household_id: t.String(),
    status: t.Optional(TaskStatusSchema),
    assignee_id: t.Optional(t.String())
});

export const ListTasksInputSchema = t.Object({
    user_id: t.String(),
    household_id: t.String(),
    status: t.Optional(TaskStatusSchema),
    assignee_id: t.Optional(t.String())
});

export const ListTasksOutputSchema = t.Array(TaskSchema);

export const UpdateTaskStatusBodySchema = t.Object({
    status: TaskStatusSchema
});

export const UpdateTaskStatusInputSchema = t.Object({
    user_id: t.String(),
    id: t.String(),
    status: TaskStatusSchema
});

export const UpdateTaskStatusOutputSchema = TaskSchema;

export const AssignTaskBodySchema = t.Object({
    assignee_id: t.String()
});

export const AssignTaskInputSchema = t.Object({
    user_id: t.String(),
    id: t.String(),
    assignee_id: t.String()
});

export const AssignTaskOutputSchema = TaskSchema;

const NullableString = t.Union([t.String(), t.Null()]);

export const UpdateTaskBodySchema = t.Object({
    title: t.Optional(t.String({ minLength: 1 })),
    description: t.Optional(NullableString),
    due_date: t.Optional(NullableString),
    assignee_id: t.Optional(NullableString),
    points: t.Optional(t.Integer({ minimum: 0, maximum: 1000 }))
});

export const VerifyTaskBodySchema = t.Object({
    /** true aprueba (suma los puntos); false la devuelve a pendiente. */
    approve: t.Boolean()
});

export const VerifyTaskInputSchema = t.Object({
    user_id: t.String(),
    id: t.String(),
    approve: t.Boolean()
});

export const PointsSummaryInputSchema = t.Object({
    user_id: t.String(),
    household_id: t.String(),
    /** ISO 8601. Solo puntos de tareas completadas desde esta fecha. */
    from: t.Optional(t.String())
});

export const PointsSummaryOutputSchema = t.Array(t.Object({
    user_id: t.String(),
    points: t.Number()
}));

export const UpdateTaskInputSchema = t.Object({
    user_id: t.String(),
    id: t.String(),
    title: t.Optional(t.String({ minLength: 1 })),
    description: t.Optional(NullableString),
    due_date: t.Optional(NullableString),
    assignee_id: t.Optional(NullableString),
    points: t.Optional(t.Integer({ minimum: 0, maximum: 1000 }))
});

export const UpdateTaskOutputSchema = TaskSchema;

export const DeleteTaskInputSchema = t.Object({
    user_id: t.String(),
    id: t.String()
});

export const DeleteTaskOutputSchema = t.Object({
    success: t.Boolean()
});
