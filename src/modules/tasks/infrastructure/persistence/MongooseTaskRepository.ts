import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { TaskEntity } from '../../domain/entities/TaskEntity.js';
import { Types } from 'mongoose';
import { Task, ITask } from '../../../../models/Task.js';

export class MongooseTaskRepository implements TaskRepository {
    private mapToEntity(doc: any): TaskEntity {
        return {
            id: doc._id.toString(),
            household_id: doc.household_id.toString(),
            creator_id: doc.creator_id.toString(),
            assignee_id: doc.assignee_id ? doc.assignee_id.toString() : null,
            title: doc.title,
            description: doc.description,
            status: doc.status,
            due_date: doc.due_date,
            points: doc.points ?? 0,
            completed_at: doc.completed_at ?? null,
            created_at: doc.created_at,
            updated_at: doc.updated_at
        };
    }

    async create(task: Omit<TaskEntity, 'id' | 'created_at' | 'updated_at'>): Promise<TaskEntity> {
        const newTask = new Task(task);
        const savedTask = await newTask.save();
        return this.mapToEntity(savedTask.toObject());
    }

    async findById(id: string): Promise<TaskEntity | null> {
        const task = await Task.findById(id).lean();
        if (!task) return null;
        return this.mapToEntity(task);
    }

    async findByHousehold(household_id: string, filters?: { status?: TaskEntity['status'], assignee_id?: string }): Promise<TaskEntity[]> {
        const query: any = { household_id };
        if (filters?.status) query.status = filters.status;
        if (filters?.assignee_id) query.assignee_id = filters.assignee_id;

        const tasks = await Task.find(query).lean();
        return tasks.map(t => this.mapToEntity(t));
    }

    async updateStatus(id: string, status: TaskEntity['status']): Promise<TaskEntity | null> {
        // completed_at marca cuándo se completó: cuenta para los puntos.
        const completed_at = status === 'completed' ? new Date() : null;
        const updatedTask = await Task.findByIdAndUpdate(id, { status, completed_at }, { new: true }).lean();
        if (!updatedTask) return null;
        return this.mapToEntity(updatedTask);
    }

    async assign(id: string, assignee_id: string): Promise<TaskEntity | null> {
        const updatedTask = await Task.findByIdAndUpdate(id, { assignee_id }, { new: true }).lean();
        if (!updatedTask) return null;
        return this.mapToEntity(updatedTask);
    }

    async sumPointsByAssignee(household_id: string, since?: Date): Promise<{ user_id: string; points: number }[]> {
        const match: Record<string, unknown> = {
            household_id: new Types.ObjectId(household_id),
            status: 'completed',
            points: { $gt: 0 },
            assignee_id: { $ne: null },
        };
        if (since) match.completed_at = { $gte: since };
        const rows = await Task.aggregate([
            { $match: match },
            { $group: { _id: '$assignee_id', points: { $sum: '$points' } } },
        ]);
        return rows.map((row) => ({ user_id: row._id.toString(), points: row.points }));
    }

    async update(id: string, data: Partial<Pick<TaskEntity, 'title' | 'description' | 'due_date' | 'assignee_id' | 'points'>>): Promise<TaskEntity | null> {
        // Si cambia la fecha, la tarea puede recordarse otra vez.
        const changes = 'due_date' in data ? { ...data, reminder_sent_at: null } : data;
        const updatedTask = await Task.findByIdAndUpdate(id, changes, { new: true }).lean();
        if (!updatedTask) return null;
        return this.mapToEntity(updatedTask);
    }

    async delete(id: string): Promise<boolean> {
        const result = await Task.findByIdAndDelete(id);
        return result !== null;
    }
}
