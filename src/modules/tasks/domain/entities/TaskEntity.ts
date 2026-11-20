export interface TaskEntity {
    id: string;
    household_id: string;
    creator_id: string;
    assignee_id?: string | null;
    title: string;
    description?: string | null;
    /** waiting_verification: un niño la marcó y un admin tiene que aprobarla. */
    status: 'pending' | 'in_progress' | 'waiting_verification' | 'completed';
    /** Puntos que suma al completarse (Premium). 0 = sin puntos. */
    points?: number;
    completed_at?: Date | null;
    due_date?: Date | null;
    created_at: Date;
    updated_at: Date;
}
