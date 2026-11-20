import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { GetHouseholdUseCase } from '../src/modules/household/application/useCases/GetHouseholdUseCase.js';
import { ChangeMemberRoleUseCase } from '../src/modules/household/application/useCases/ChangeMemberRoleUseCase.js';
import { CreateTaskUseCase } from '../src/modules/tasks/application/useCases/createTaskUseCase.js';
import { UpdateTaskStatusUseCase } from '../src/modules/tasks/application/useCases/updateTaskStatusUseCase.js';
import { VerifyTaskUseCase } from '../src/modules/tasks/application/useCases/verifyTaskUseCase.js';
import type { HouseholdEntity } from '../src/modules/household/domain/entities/HouseholdEntity.js';
import type { TaskEntity } from '../src/modules/tasks/domain/entities/TaskEntity.js';

function makeHousehold(): HouseholdEntity {
  return {
    id: 'house-a',
    name: 'Casa',
    admin_id: 'ana',
    invite_code: 'ABC123',
    members: [
      { user_id: 'ana', role: 'admin', display_name: 'Ana', joined_at: new Date() },
      { user_id: 'carlos', role: 'member', display_name: 'Carlos', joined_at: new Date() },
      { user_id: 'sofia', role: 'kid', display_name: 'Sofía', joined_at: new Date() },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function setup(ownerPlan: 'free' | 'premium' = 'premium') {
  const household = makeHousehold();
  const householdRepo = {
    async findById() {
      return household;
    },
    async setMemberRole(_id: string, userId: string, role: HouseholdEntity['members'][number]['role']) {
      household.members.find((m) => m.user_id === userId)!.role = role;
      return household;
    },
  } as any;
  const getHousehold = new GetHouseholdUseCase(householdRepo);
  const planLookup = { planOf: async () => ownerPlan };

  const tasks = new Map<string, TaskEntity>();
  const taskRepo = {
    async create(data: any) {
      const task = { ...data, id: `t-${tasks.size + 1}`, created_at: new Date(), updated_at: new Date() };
      tasks.set(task.id, task);
      return task;
    },
    async findById(id: string) {
      return tasks.get(id) ?? null;
    },
    async updateStatus(id: string, status: TaskEntity['status']) {
      const task = tasks.get(id)!;
      task.status = status;
      task.completed_at = status === 'completed' ? new Date() : null;
      return task;
    },
  } as any;

  return { household, householdRepo, getHousehold, planLookup, taskRepo };
}

const rejectsWith = (p: Promise<unknown>, code: string) => assert.rejects(p, (e: any) => e.code === code);
const rejectsStatus = (p: Promise<unknown>, status: number) => assert.rejects(p, (e: any) => e.statusCode === status);

describe('rol Niño', () => {
  test('un admin convierte a un miembro en Niño en un hogar Premium', async () => {
    const { householdRepo, planLookup, household } = setup('premium');
    await new ChangeMemberRoleUseCase(householdRepo, planLookup).execute({
      householdId: 'house-a',
      requestingUserId: 'ana',
      targetUserId: 'carlos',
      role: 'kid',
    });
    assert.equal(household.members.find((m) => m.user_id === 'carlos')!.role, 'kid');
  });

  test('Niño requiere hogar Premium; Admin y Miembro no', async () => {
    const { householdRepo, planLookup } = setup('free');
    const useCase = new ChangeMemberRoleUseCase(householdRepo, planLookup);
    await rejectsWith(
      useCase.execute({ householdId: 'house-a', requestingUserId: 'ana', targetUserId: 'carlos', role: 'kid' }),
      'PLAN_REQUIRED',
    );
    await useCase.execute({ householdId: 'house-a', requestingUserId: 'ana', targetUserId: 'carlos', role: 'admin' });
  });

  test('solo un admin cambia roles y nadie cambia el del dueño', async () => {
    const { householdRepo, planLookup } = setup();
    const useCase = new ChangeMemberRoleUseCase(householdRepo, planLookup);
    await rejectsStatus(
      useCase.execute({ householdId: 'house-a', requestingUserId: 'carlos', targetUserId: 'sofia', role: 'member' }),
      403,
    );
    await rejectsStatus(
      useCase.execute({ householdId: 'house-a', requestingUserId: 'ana', targetUserId: 'ana', role: 'member' }),
      403,
    );
  });
});

describe('puntos y verificación', () => {
  test('dar puntos requiere hogar Premium', async () => {
    const { taskRepo, getHousehold, planLookup } = setup('free');
    const create = new CreateTaskUseCase(taskRepo, getHousehold, planLookup);
    await rejectsWith(create.execute({ household_id: 'house-a', creator_id: 'ana', title: 'Ordenar', points: 20 }), 'PLAN_REQUIRED');
    const noPoints = await create.execute({ household_id: 'house-a', creator_id: 'ana', title: 'Ordenar' });
    assert.equal(noPoints.points, 0);
  });

  test('un niño completa una tarea con puntos: queda por verificar y un admin la aprueba', async () => {
    const { taskRepo, getHousehold, planLookup } = setup();
    const task = await new CreateTaskUseCase(taskRepo, getHousehold, planLookup).execute({
      household_id: 'house-a',
      creator_id: 'ana',
      title: 'Ordenar el cuarto',
      assignee_id: 'sofia',
      points: 20,
    });

    const marked = await new UpdateTaskStatusUseCase(taskRepo, getHousehold).execute({ id: task.id, user_id: 'sofia', status: 'completed' });
    assert.equal(marked.status, 'waiting_verification');

    const verify = new VerifyTaskUseCase(taskRepo, getHousehold);
    await rejectsStatus(verify.execute({ id: task.id, user_id: 'carlos', approve: true }), 403);
    const approved = await verify.execute({ id: task.id, user_id: 'ana', approve: true });
    assert.equal(approved.status, 'completed');
  });

  test('si el admin la devuelve, vuelve a pendiente', async () => {
    const { taskRepo, getHousehold, planLookup } = setup();
    const task = await new CreateTaskUseCase(taskRepo, getHousehold, planLookup).execute({
      household_id: 'house-a',
      creator_id: 'ana',
      title: 'Tarea',
      assignee_id: 'sofia',
      points: 5,
    });
    await new UpdateTaskStatusUseCase(taskRepo, getHousehold).execute({ id: task.id, user_id: 'sofia', status: 'completed' });
    const rejected = await new VerifyTaskUseCase(taskRepo, getHousehold).execute({ id: task.id, user_id: 'ana', approve: false });
    assert.equal(rejected.status, 'pending');
  });

  test('un adulto completa directo y nadie pide verificación a mano', async () => {
    const { taskRepo, getHousehold, planLookup } = setup();
    const task = await new CreateTaskUseCase(taskRepo, getHousehold, planLookup).execute({
      household_id: 'house-a',
      creator_id: 'ana',
      title: 'Tarea',
      assignee_id: 'carlos',
      points: 5,
    });
    const status = new UpdateTaskStatusUseCase(taskRepo, getHousehold);
    assert.equal((await status.execute({ id: task.id, user_id: 'carlos', status: 'completed' })).status, 'completed');
    assert.equal((await status.execute({ id: task.id, user_id: 'carlos', status: 'waiting_verification' })).status, 'completed');
  });

  test('una tarea sin puntos de un niño se completa directo', async () => {
    const { taskRepo, getHousehold, planLookup } = setup();
    const task = await new CreateTaskUseCase(taskRepo, getHousehold, planLookup).execute({
      household_id: 'house-a',
      creator_id: 'ana',
      title: 'Tarea',
      assignee_id: 'sofia',
    });
    const done = await new UpdateTaskStatusUseCase(taskRepo, getHousehold).execute({ id: task.id, user_id: 'sofia', status: 'completed' });
    assert.equal(done.status, 'completed');
  });
});
