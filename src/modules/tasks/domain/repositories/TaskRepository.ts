import { TaskEntity } from '../entities/TaskEntity.js';

export interface TaskRepository {
    create(task: Omit<TaskEntity, 'id' | 'created_at' | 'updated_at'>): Promise<TaskEntity>;
    findById(id: string): Promise<TaskEntity | null>;
    findByHousehold(household_id: string, filters?: { status?: TaskEntity['status'], assignee_id?: string }): Promise<TaskEntity[]>;
    updateStatus(id: string, status: TaskEntity['status']): Promise<TaskEntity | null>;
    assign(id: string, assignee_id: string): Promise<TaskEntity | null>;
    delete(id: string): Promise<boolean>;
}
