import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { RegenerateInviteCodeUseCase } from '../src/modules/household/application/useCases/RegenerateInviteCodeUseCase.js';
import type { HouseholdEntity } from '../src/modules/household/domain/entities/HouseholdEntity.js';

function makeRepo(failFirstWithDuplicate = 0) {
  const household: HouseholdEntity = {
    id: 'house-a',
    name: 'Casa',
    admin_id: 'ana',
    invite_code: 'AAAAAA',
    members: [
      { user_id: 'ana', role: 'admin', display_name: 'Ana', joined_at: new Date() },
      { user_id: 'carlos', role: 'member', display_name: 'Carlos', joined_at: new Date() },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  };
  let duplicates = failFirstWithDuplicate;
  let attempts = 0;
  return {
    household,
    get attempts() {
      return attempts;
    },
    async findById() {
      return household;
    },
    async setInviteCode(_id: string, code: string) {
      attempts += 1;
      if (duplicates > 0) {
        duplicates -= 1;
        throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
      }
      household.invite_code = code;
      return household;
    },
  } as any;
}

describe('hogar: regenerar código de invitación', () => {
  test('un admin obtiene un código nuevo de 6 caracteres', async () => {
    const repo = makeRepo();
    const result = await new RegenerateInviteCodeUseCase(repo).execute({ householdId: 'house-a', userId: 'ana' });
    assert.match(result.invite_code, /^[0-9A-F]{6}$/);
    assert.notEqual(result.invite_code, 'AAAAAA');
  });

  test('un miembro que no es admin recibe 403', async () => {
    const repo = makeRepo();
    await assert.rejects(
      new RegenerateInviteCodeUseCase(repo).execute({ householdId: 'house-a', userId: 'carlos' }),
      (error: any) => error.statusCode === 403,
    );
    assert.equal(repo.household.invite_code, 'AAAAAA');
  });

  test('si el código ya existe en otro hogar, reintenta', async () => {
    const repo = makeRepo(2);
    await new RegenerateInviteCodeUseCase(repo).execute({ householdId: 'house-a', userId: 'ana' });
    assert.equal(repo.attempts, 3);
  });
});
