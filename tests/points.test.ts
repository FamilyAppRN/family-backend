import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { GetHouseholdUseCase } from '../src/modules/household/application/useCases/GetHouseholdUseCase.js';
import { PointsSummaryUseCase } from '../src/modules/tasks/application/useCases/pointsSummaryUseCase.js';

const getHousehold = new GetHouseholdUseCase({
  findById: async () => ({
    id: 'house-a',
    name: 'Casa',
    admin_id: 'ana',
    invite_code: 'ABC123',
    members: [{ user_id: 'ana', role: 'admin', display_name: 'Ana', joined_at: new Date() }],
    created_at: new Date(),
    updated_at: new Date(),
  }),
} as any);

function makeRepo() {
  const calls: (Date | undefined)[] = [];
  return {
    calls,
    async sumPointsByAssignee(_householdId: string, since?: Date) {
      calls.push(since);
      return [{ user_id: 'sofia', points: since ? 45 : 120 }];
    },
  } as any;
}

describe('puntos por período', () => {
  test('sin "from" suma todo; con "from" pasa la fecha al repositorio', async () => {
    const repo = makeRepo();
    const useCase = new PointsSummaryUseCase(repo, getHousehold);

    const total = await useCase.execute({ household_id: 'house-a', user_id: 'ana' });
    const week = await useCase.execute({ household_id: 'house-a', user_id: 'ana', from: '2026-11-09T04:00:00.000Z' });

    assert.equal(total[0].points, 120);
    assert.equal(week[0].points, 45);
    assert.equal(repo.calls[0], undefined);
    assert.equal(repo.calls[1].toISOString(), '2026-11-09T04:00:00.000Z');
  });

  test('una fecha inválida devuelve 400', async () => {
    await assert.rejects(
      new PointsSummaryUseCase(makeRepo(), getHousehold).execute({ household_id: 'house-a', user_id: 'ana', from: 'ayer' }),
      (error: any) => error.statusCode === 400,
    );
  });

  test('alguien ajeno al hogar no ve los puntos', async () => {
    await assert.rejects(
      new PointsSummaryUseCase(makeRepo(), getHousehold).execute({ household_id: 'house-a', user_id: 'extraño' }),
      (error: any) => error.statusCode === 404,
    );
  });
});
