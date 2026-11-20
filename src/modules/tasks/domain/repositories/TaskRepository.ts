import { TaskEntity } from '../entities/TaskEntity.js';

export interface TaskRepository {
    create(task: Omit<TaskEntity, 'id' | 'created_at' | 'updated_at'>): Promise<TaskEntity>;
    findById(id: string): Promise<TaskEntity | null>;
    findByHousehold(household_id: string, filters?: { status?: TaskEntity['status'], assignee_id?: string }): Promise<TaskEntity[]>;
    updateStatus(id: string, status: TaskEntity['status']): Promise<TaskEntity | null>;
    assign(id: string, assignee_id: string): Promise<TaskEntity | null>;
    update(id: string, data: Partial<Pick<TaskEntity, 'title' | 'description' | 'due_date' | 'assignee_id' | 'points'>>): Promise<TaskEntity | null>;
    /** Puntos de tareas completadas, por persona asignada. */
    /** Con `since`, solo tareas completadas desde esa fecha (ej. el lunes de esta semana). */
    sumPointsByAssignee(household_id: string, since?: Date): Promise<{ user_id: string; points: number }[]>;
    delete(id: string): Promise<boolean>;
}
