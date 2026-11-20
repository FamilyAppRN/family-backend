import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { effectivePlan } from '../src/modules/household/domain/planPolicy.js';
import { CreateHouseholdUseCase } from '../src/modules/household/application/useCases/CreateHouseholdUseCase.js';
import { AddMemberUseCase } from '../src/modules/household/application/useCases/AddMemberUseCase.js';
import type { HouseholdEntity } from '../src/modules/household/domain/entities/HouseholdEntity.js';
import type { Plan } from '../src/modules/household/domain/planPolicy.js';

function household(id: string, ownerId: string, memberIds: string[], code = id.toUpperCase()): HouseholdEntity {
  return {
    id,
    name: id,
    admin_id: ownerId,
    invite_code: code,
    members: memberIds.map((user_id) => ({
      user_id,
      role: user_id === ownerId ? 'admin' : 'member',
      display_name: user_id,
      joined_at: new Date(),
    })),
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeRepo(households: HouseholdEntity[]) {
  return {
    async findByUserId(userId: string) {
      return households.filter((h) => h.members.some((m) => m.user_id === userId));
    },
    async findByInviteCode(code: string) {
      return households.find((h) => h.invite_code === code) ?? null;
    },
    async create(data: any) {
      const created = { ...data, id: `new-${households.length}`, created_at: new Date(), updated_at: new Date() };
      households.push(created);
      return created;
    },
    async addMember(id: string, member: any) {
      const h = households.find((x) => x.id === id)!;
      h.members.push(member);
      return h;
    },
  } as any;
}

const plans = (map: Record<string, Plan>) => ({ planOf: async (id: string) => map[id] ?? 'free' });
const rejectsWith = (p: Promise<unknown>, code: string) => assert.rejects(p, (e: any) => e.code === code);

describe('plan vigente', () => {
  test('premium solo mientras no venza', () => {
    const now = new Date('2026-11-11T12:00:00Z');
    assert.equal(effectivePlan('premium', null, now), 'premium');
    assert.equal(effectivePlan('premium', '2026-12-01T00:00:00Z', now), 'premium');
    assert.equal(effectivePlan('premium', '2026-11-01T00:00:00Z', now), 'free', 'vencido');
    assert.equal(effectivePlan('free', null, now), 'free');
    assert.equal(effectivePlan(undefined, null, now), 'free');
  });
});

describe('crear hogar', () => {
  test('gratis: 1 hogar propio; el segundo se rechaza', async () => {
    const repo = makeRepo([household('casa-a', 'ana', ['ana'])]);
    await rejectsWith(
      new CreateHouseholdUseCase(repo).execute({ name: 'Otra', user_id: 'ana', user_name: 'Ana', plan: 'free' }),
      'LIMIT_REACHED_CREATE_HOUSEHOLD',
    );
  });

  test('ser miembro de otro hogar no cuenta como propio', async () => {
    const repo = makeRepo([household('casa-b', 'beto', ['beto', 'ana'])]);
    const created = await new CreateHouseholdUseCase(repo).execute({ name: 'Mía', user_id: 'ana', user_name: 'Ana', plan: 'free' });
    assert.equal(created.name, 'Mía');
  });

  test('premium puede crear más', async () => {
    const repo = makeRepo([household('casa-a', 'ana', ['ana'])]);
    const created = await new CreateHouseholdUseCase(repo).execute({ name: 'Playa', user_id: 'ana', user_name: 'Ana', plan: 'premium' });
    assert.equal(created.name, 'Playa');
  });
});

describe('unirse a un hogar', () => {
  test('gratis: como máximo 2 hogares en total', async () => {
    const repo = makeRepo([
      household('casa-a', 'ana', ['ana']),
      household('casa-b', 'beto', ['beto', 'ana']),
      household('casa-c', 'carla', ['carla'], 'CODE-C'),
    ]);
    await rejectsWith(
      new AddMemberUseCase(repo, plans({})).execute({ inviteCode: 'CODE-C', userId: 'ana', userName: 'Ana', plan: 'free' }),
      'LIMIT_REACHED_JOIN_HOUSEHOLD',
    );
  });

  test('hogar de dueño gratis: 4 miembros como máximo, aunque quien entra sea premium', async () => {
    const full = household('casa-a', 'ana', ['ana', 'm1', 'm2', 'm3'], 'CODE-A');
    const repo = makeRepo([full]);
    await rejectsWith(
      new AddMemberUseCase(repo, plans({ ana: 'free' })).execute({ inviteCode: 'CODE-A', userId: 'zoe', userName: 'Zoe', plan: 'premium' }),
      'HOUSEHOLD_FULL',
    );
  });

  test('hogar de dueño premium admite más de 4', async () => {
    const repo = makeRepo([household('casa-a', 'ana', ['ana', 'm1', 'm2', 'm3'], 'CODE-A')]);
    const result = await new AddMemberUseCase(repo, plans({ ana: 'premium' })).execute({
      inviteCode: 'CODE-A',
      userId: 'zoe',
      userName: 'Zoe',
      plan: 'free',
    });
    assert.equal(result.members.length, 5);
  });
});
