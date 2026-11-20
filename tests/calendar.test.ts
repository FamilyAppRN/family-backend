import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { expandOccurrences } from '../src/modules/calendar/domain/occurrences.js';
import { CalendarService } from '../src/modules/calendar/application/CalendarService.js';
import { GetHouseholdUseCase } from '../src/modules/household/application/useCases/GetHouseholdUseCase.js';
import type { CalendarEventEntity } from '../src/modules/calendar/domain/entities/CalendarEventEntity.js';

const d = (iso: string) => new Date(iso);

function event(overrides: Partial<CalendarEventEntity> = {}): CalendarEventEntity {
  return {
    id: 'ev-1',
    household_id: 'house-a',
    created_by: 'carlos',
    title: 'Pediatra',
    description: null,
    start_at: d('2026-11-09T13:00:00Z'),
    end_at: d('2026-11-09T14:00:00Z'),
    all_day: false,
    recurrence: null,
    attendees: [],
    created_at: d('2026-11-01T00:00:00Z'),
    updated_at: d('2026-11-01T00:00:00Z'),
    ...overrides,
  };
}

describe('calendario: apariciones', () => {
  test('evento único: solo si cae en el rango', () => {
    assert.equal(expandOccurrences(event(), d('2026-11-09T00:00:00Z'), d('2026-11-10T00:00:00Z')).length, 1);
    assert.equal(expandOccurrences(event(), d('2026-11-10T00:00:00Z'), d('2026-11-11T00:00:00Z')).length, 0);
  });

  test('semanal: una por semana, conservando la duración', () => {
    const weekly = event({ recurrence: { freq: 'weekly', until: null } });
    const occurrences = expandOccurrences(weekly, d('2026-11-01T00:00:00Z'), d('2026-12-01T00:00:00Z'));
    assert.deepEqual(
      occurrences.map((o) => o.occurrence_start.toISOString().slice(0, 10)),
      ['2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30'],
    );
    assert.equal(occurrences[1].occurrence_end!.getTime() - occurrences[1].occurrence_start.getTime(), 60 * 60 * 1000);
  });

  test('respeta la fecha de fin de la repetición', () => {
    const daily = event({ recurrence: { freq: 'daily', until: d('2026-11-11T23:59:00Z') } });
    assert.equal(expandOccurrences(daily, d('2026-11-01T00:00:00Z'), d('2026-12-01T00:00:00Z')).length, 3);
  });

  test('mensual', () => {
    const monthly = event({ recurrence: { freq: 'monthly', until: null } });
    const occurrences = expandOccurrences(monthly, d('2026-11-01T00:00:00Z'), d('2027-01-31T00:00:00Z'));
    assert.deepEqual(occurrences.map((o) => o.occurrence_start.toISOString().slice(0, 7)), ['2026-11', '2026-12', '2027-01']);
  });
});

describe('calendario: permisos', () => {
  const household = {
    id: 'house-a',
    name: 'Casa',
    admin_id: 'ana',
    invite_code: 'ABC123',
    members: [
      { user_id: 'ana', role: 'admin', display_name: 'Ana', joined_at: new Date() },
      { user_id: 'carlos', role: 'member', display_name: 'Carlos', joined_at: new Date() },
      { user_id: 'sofia', role: 'member', display_name: 'Sofía', joined_at: new Date() },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  };
  const getHousehold = new GetHouseholdUseCase({ findById: async () => household } as any);

  function makeService(ownerPlan: 'free' | 'premium') {
    const store = new Map<string, CalendarEventEntity>([['ev-1', event()]]);
    const repo = {
      async create(data: any) {
        const created = { ...data, id: 'ev-2', created_at: new Date(), updated_at: new Date() };
        store.set(created.id, created);
        return created;
      },
      async findById(id: string) {
        return store.get(id) ?? null;
      },
      async findCandidates() {
        return [...store.values()];
      },
      async update(id: string, changes: any) {
        const updated = { ...store.get(id)!, ...changes };
        store.set(id, updated);
        return updated;
      },
      async delete(id: string) {
        store.delete(id);
      },
    };
    return { store, service: new CalendarService(repo, getHousehold, { planOf: async () => ownerPlan }) };
  }

  const rejectsWith = (p: Promise<unknown>, code: string) => assert.rejects(p, (e: any) => e.code === code);

  test('hogar gratis: el calendario no está disponible', async () => {
    const { service } = makeService('free');
    await rejectsWith(service.list('house-a', 'carlos', '2026-11-01T00:00:00Z', '2026-11-30T00:00:00Z'), 'PLAN_REQUIRED');
    await rejectsWith(service.create('house-a', 'carlos', { title: 'X', start_at: '2026-11-12T10:00:00Z' }), 'PLAN_REQUIRED');
  });

  test('hogar premium: cualquier miembro crea y lista', async () => {
    const { service } = makeService('premium');
    await service.create('house-a', 'sofia', { title: 'Dentista', start_at: '2026-11-12T20:30:00Z' });
    const list = await service.list('house-a', 'sofia', '2026-11-01T00:00:00Z', '2026-11-30T00:00:00Z');
    assert.deepEqual(list.map((o) => o.title), ['Pediatra', 'Dentista']);
  });

  test('editar y borrar: quien lo creó o un admin; otro miembro recibe 403', async () => {
    const { service, store } = makeService('premium');
    await rejectsWith(service.update('ev-1', 'sofia', { title: 'No' }), 'CALENDAR_EVENT_FORBIDDEN');
    assert.equal((await service.update('ev-1', 'carlos', { title: 'Pediatra de Mateo' })).title, 'Pediatra de Mateo');
    await service.remove('ev-1', 'ana');
    assert.equal(store.has('ev-1'), false);
  });

  test('rechaza un evento que termina antes de empezar', async () => {
    const { service } = makeService('premium');
    await rejectsWith(
      service.create('house-a', 'carlos', { title: 'X', start_at: '2026-11-12T10:00:00Z', end_at: '2026-11-12T09:00:00Z' }),
      'CALENDAR_INVALID_RANGE',
    );
  });

  test('los invitados tienen que ser del hogar', async () => {
    const { service } = makeService('premium');
    await assert.rejects(
      service.create('house-a', 'carlos', { title: 'X', start_at: '2026-11-12T10:00:00Z', attendees: ['extraño'] }),
      (e: any) => e.statusCode === 404,
    );
  });
});
