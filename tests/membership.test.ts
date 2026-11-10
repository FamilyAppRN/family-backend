import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { GetHouseholdUseCase } from '../src/modules/household/application/useCases/GetHouseholdUseCase.js';
import { HouseholdEntity } from '../src/modules/household/domain/entities/HouseholdEntity.js';
import { TaskEntity } from '../src/modules/tasks/domain/entities/TaskEntity.js';
import { NoteEntity } from '../src/modules/notes/domain/entities/note.entity.js';
import { CreateTaskUseCase } from '../src/modules/tasks/application/useCases/createTaskUseCase.js';
import { ListTasksUseCase } from '../src/modules/tasks/application/useCases/listTasksUseCase.js';
import { UpdateTaskStatusUseCase } from '../src/modules/tasks/application/useCases/updateTaskStatusUseCase.js';
import { AssignTaskUseCase } from '../src/modules/tasks/application/useCases/assignTaskUseCase.js';
import { DeleteTaskUseCase } from '../src/modules/tasks/application/useCases/deleteTaskUseCase.js';
import { ListNotesUseCase } from '../src/modules/notes/application/listNotesUseCase.js';
import { CreateNoteUseCase } from '../src/modules/notes/application/createNoteUseCase.js';
import { UpdateNoteUseCase } from '../src/modules/notes/application/updateNoteUseCase.js';
import { DeleteNoteUseCase } from '../src/modules/notes/application/deleteNoteUseCase.js';

// Casa A: ana (admin) y carlos (miembro). Casa B: beto (admin), ajeno a A.
const HOUSE_A = 'house-a';
const HOUSE_B = 'house-b';
const ANA = 'ana';
const CARLOS = 'carlos';
const BETO = 'beto';

function makeHousehold(id: string, members: Array<[string, 'admin' | 'member']>): HouseholdEntity {
  return {
    id,
    name: id,
    admin_id: members[0][0],
    invite_code: 'ABC123',
    members: members.map(([user_id, role]) => ({ user_id, role, display_name: user_id, joined_at: new Date() })),
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeGetHousehold(): GetHouseholdUseCase {
  const households = new Map<string, HouseholdEntity>([
    [HOUSE_A, makeHousehold(HOUSE_A, [[ANA, 'admin'], [CARLOS, 'member']])],
    [HOUSE_B, makeHousehold(HOUSE_B, [[BETO, 'admin']])],
  ]);
  const repo = { findById: async (id: string) => households.get(id) ?? null } as any;
  return new GetHouseholdUseCase(repo);
}

function makeTaskRepo() {
  const tasks = new Map<string, TaskEntity>();
  let seq = 0;
  const now = new Date();
  return {
    tasks,
    async create(data: any) {
      const task = { ...data, id: `task-${++seq}`, created_at: now, updated_at: now };
      tasks.set(task.id, task);
      return task;
    },
    async findById(id: string) { return tasks.get(id) ?? null; },
    async findByHousehold(householdId: string) { return [...tasks.values()].filter((t) => t.household_id === householdId); },
    async updateStatus(id: string, status: TaskEntity['status']) {
      const task = tasks.get(id);
      if (!task) return null;
      task.status = status;
      return task;
    },
    async assign(id: string, assignee_id: string) {
      const task = tasks.get(id);
      if (!task) return null;
      task.assignee_id = assignee_id;
      return task;
    },
    async delete(id: string) { return tasks.delete(id); },
  };
}

function makeNoteRepo() {
  const notes = new Map<string, NoteEntity>();
  let seq = 0;
  const now = new Date();
  return {
    notes,
    async create(data: any) {
      const note = { ...data, id: `note-${++seq}`, created_at: now, updated_at: now };
      notes.set(note.id, note);
      return note;
    },
    async findByHouseholdId(householdId: string) { return [...notes.values()].filter((n) => n.household_id === householdId); },
    async findById(id: string) { return notes.get(id) ?? null; },
    async update(id: string, data: Partial<NoteEntity>) {
      const note = notes.get(id);
      if (!note) return null;
      Object.assign(note, data);
      return note;
    },
    async delete(id: string) { notes.delete(id); },
  };
}

const rejectsWithStatus = (promise: Promise<unknown>, status: number) =>
  assert.rejects(promise, (error: any) => error.statusCode === status);

describe('tareas: membresía del hogar', () => {
  test('un miembro crea, lista, completa, asigna y borra tareas', async () => {
    const repo = makeTaskRepo();
    const getHousehold = makeGetHousehold();

    const task = await new CreateTaskUseCase(repo, getHousehold).execute({
      household_id: HOUSE_A, creator_id: ANA, title: 'Sacar la basura', assignee_id: CARLOS,
    });
    const list = await new ListTasksUseCase(repo, getHousehold).execute({ household_id: HOUSE_A, user_id: CARLOS });
    assert.equal(list.length, 1);

    const done = await new UpdateTaskStatusUseCase(repo, getHousehold).execute({ id: task.id, user_id: CARLOS, status: 'completed' });
    assert.equal(done.status, 'completed');

    const assigned = await new AssignTaskUseCase(repo, getHousehold).execute({ id: task.id, user_id: ANA, assignee_id: ANA });
    assert.equal(assigned.assignee_id, ANA);

    await new DeleteTaskUseCase(repo, getHousehold).execute({ id: task.id, user_id: ANA });
    assert.equal(repo.tasks.size, 0);
  });

  test('alguien ajeno al hogar no puede leer ni tocar sus tareas', async () => {
    const repo = makeTaskRepo();
    const getHousehold = makeGetHousehold();
    const task = await new CreateTaskUseCase(repo, getHousehold).execute({ household_id: HOUSE_A, creator_id: ANA, title: 'Pagar la luz' });

    await rejectsWithStatus(new ListTasksUseCase(repo, getHousehold).execute({ household_id: HOUSE_A, user_id: BETO }), 404);
    await rejectsWithStatus(new CreateTaskUseCase(repo, getHousehold).execute({ household_id: HOUSE_A, creator_id: BETO, title: 'x' }), 404);
    await rejectsWithStatus(new UpdateTaskStatusUseCase(repo, getHousehold).execute({ id: task.id, user_id: BETO, status: 'completed' }), 404);
    await rejectsWithStatus(new AssignTaskUseCase(repo, getHousehold).execute({ id: task.id, user_id: BETO, assignee_id: BETO }), 404);
    await rejectsWithStatus(new DeleteTaskUseCase(repo, getHousehold).execute({ id: task.id, user_id: BETO }), 404);

    assert.equal(repo.tasks.get(task.id)?.status, 'pending');
  });

  test('no se puede asignar una tarea a alguien de otro hogar', async () => {
    const repo = makeTaskRepo();
    const getHousehold = makeGetHousehold();

    await rejectsWithStatus(new CreateTaskUseCase(repo, getHousehold).execute({
      household_id: HOUSE_A, creator_id: ANA, title: 'x', assignee_id: BETO,
    }), 404);

    const task = await new CreateTaskUseCase(repo, getHousehold).execute({ household_id: HOUSE_A, creator_id: ANA, title: 'y' });
    await rejectsWithStatus(new AssignTaskUseCase(repo, getHousehold).execute({ id: task.id, user_id: ANA, assignee_id: BETO }), 404);
  });
});

describe('notas: membresía y permisos de edición', () => {
  async function setup() {
    const repo = makeNoteRepo();
    const getHousehold = makeGetHousehold();
    const note = await new CreateNoteUseCase(repo, getHousehold).execute({
      householdId: HOUSE_A, userId: CARLOS, title: 'Vacuna', content: 'Jueves 10:00',
    });
    return { repo, getHousehold, note };
  }

  test('alguien ajeno al hogar no puede listar, crear, editar ni borrar', async () => {
    const { repo, getHousehold, note } = await setup();

    await rejectsWithStatus(new ListNotesUseCase(repo, getHousehold).execute({ householdId: HOUSE_A, userId: BETO }), 404);
    await rejectsWithStatus(new CreateNoteUseCase(repo, getHousehold).execute({ householdId: HOUSE_A, userId: BETO, title: 'x', content: 'x' }), 404);
    await rejectsWithStatus(new UpdateNoteUseCase(repo, getHousehold).execute({ noteId: note.id, householdId: HOUSE_A, userId: BETO, title: 'hack' }), 404);
    await rejectsWithStatus(new DeleteNoteUseCase(repo, getHousehold).execute({ noteId: note.id, householdId: HOUSE_A, userId: BETO }), 404);
  });

  test('borrar desde la ruta de otro hogar no encuentra la nota', async () => {
    const { repo, getHousehold, note } = await setup();
    // Beto es miembro de su casa, pero la nota es de la casa A
    await rejectsWithStatus(new DeleteNoteUseCase(repo, getHousehold).execute({ noteId: note.id, householdId: HOUSE_B, userId: BETO }), 404);
    assert.equal(repo.notes.size, 1);
  });

  test('el autor y el admin editan; otro miembro recibe 403', async () => {
    const { repo, getHousehold, note } = await setup();
    const update = new UpdateNoteUseCase(repo, getHousehold);

    const byAuthor = await update.execute({ noteId: note.id, householdId: HOUSE_A, userId: CARLOS, pinned: true });
    assert.equal(byAuthor.pinned, true);

    const byAdmin = await update.execute({ noteId: note.id, householdId: HOUSE_A, userId: ANA, title: 'Vacuna de Mateo' });
    assert.equal(byAdmin.title, 'Vacuna de Mateo');

    const other = await new CreateNoteUseCase(repo, getHousehold).execute({ householdId: HOUSE_A, userId: ANA, title: 'De Ana', content: 'x' });
    await rejectsWithStatus(update.execute({ noteId: other.id, householdId: HOUSE_A, userId: CARLOS, title: 'no' }), 403);
    await rejectsWithStatus(new DeleteNoteUseCase(repo, getHousehold).execute({ noteId: other.id, householdId: HOUSE_A, userId: CARLOS }), 403);
  });
});
