export class TasksService {
  static async getTasks(householdId: string): Promise<any> {
    return { message: 'Get tasks active', householdId, tasks: [] };
  }

  static async createTask(householdId: string, userId: string, body: any): Promise<any> {
    return { message: 'Create task active', householdId, createdBy: userId, data: body };
  }

  static async updateTask(householdId: string, taskId: string, userId: string, body: any): Promise<any> {
    return { message: 'Update task active', householdId, taskId, updatedBy: userId, data: body };
  }

  static async updateTaskStatus(householdId: string, taskId: string, userId: string, body: any): Promise<any> {
    return { message: 'Update task status active', householdId, taskId, updatedBy: userId, data: body };
  }

  static async claimPoints(householdId: string, taskId: string, userId: string): Promise<any> {
    return { message: 'Claim points active', householdId, taskId, claimedBy: userId };
  }

  static async deleteTask(householdId: string, taskId: string, userId: string): Promise<any> {
    return { message: 'Delete task active', householdId, taskId, deletedBy: userId };
  }
}
