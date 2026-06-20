import { TasksService } from './tasks.service.js';

export const TasksController = {
  async getTasks({ params: { householdId } }: any) {
    return await TasksService.getTasks(householdId);
  },

  async createTask({ params: { householdId }, user, body }: any) {
    return await TasksService.createTask(householdId, user.id, body);
  },

  async updateTask({ params: { householdId, taskId }, user, body }: any) {
    return await TasksService.updateTask(householdId, taskId, user.id, body);
  },

  async updateTaskStatus({ params: { householdId, taskId }, user, body }: any) {
    return await TasksService.updateTaskStatus(householdId, taskId, user.id, body);
  },

  async claimPoints({ params: { householdId, taskId }, user }: any) {
    return await TasksService.claimPoints(householdId, taskId, user.id);
  },

  async deleteTask({ params: { householdId, taskId }, user }: any) {
    return await TasksService.deleteTask(householdId, taskId, user.id);
  }
};
