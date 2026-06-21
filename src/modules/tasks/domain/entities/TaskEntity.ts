export interface TaskEntity {
    id: string;
    household_id: string;
    creator_id: string;
    assignee_id?: string | null;
    title: string;
    description?: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    due_date?: Date | null;
    created_at: Date;
    updated_at: Date;
}
