import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership } from '../../../household/application/services/HouseholdMembership.js';
import { HouseholdEntity } from '../../../household/domain/entities/HouseholdEntity.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { TaskEntity } from '../../domain/entities/TaskEntity.js';
import { TaskNotFoundError } from '../../domain/errors/TaskNotFoundError.js';

/** Loads a task and throws unless `userId` belongs to the task's household. */
export async function getAuthorizedTask(
  taskRepository: TaskRepository,
  getHouseholdUseCase: GetHouseholdUseCase,
  taskId: string,
  userId: string,
): Promise<{ task: TaskEntity; household: HouseholdEntity }> {
  const task = await taskRepository.findById(taskId);
  if (!task) throw new TaskNotFoundError();
  const household = await assertHouseholdMembership(getHouseholdUseCase, task.household_id, userId);
  return { task, household };
}
