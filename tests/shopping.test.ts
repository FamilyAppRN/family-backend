import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { GetHouseholdUseCase } from '../src/modules/household/application/useCases/GetHouseholdUseCase.js';
import { AddItemToListUseCase } from '../src/modules/shopping/application/useCases/addItemToListUseCase.js';
import type { ShoppingListEntity, ShoppingItemEntity } from '../src/modules/shopping/domain/entities/ShoppingListEntity.js';

const HOUSE = 'house-a';
const ANA = 'ana';

const getHousehold = new GetHouseholdUseCase({
  findById: async () => ({
    id: HOUSE,
    name: 'Casa',
    admin_id: ANA,
    invite_code: 'ABC123',
    members: [{ user_id: ANA, role: 'admin', display_name: 'Ana', joined_at: new Date() }],
    created_at: new Date(),
    updated_at: new Date(),
  }),
} as any);

function makeRepo() {
  const list: ShoppingListEntity = {
    id: 'list-1',
    household_id: HOUSE,
    name: 'Compras',
    status: 'active',
    items: [],
    history: [],
    created_by: ANA,
    created_at: new Date(),
  } as ShoppingListEntity;
  return {
    list,
    async getListById() {
      return list;
    },
    async addItemToList(_listId: string, item: Omit<ShoppingItemEntity, 'id' | 'is_completed'>) {
      list.items.push({ ...item, id: `item-${list.items.length + 1}`, is_completed: false });
      return list;
    },
  } as any;
}

describe('compras: agregar ítem', () => {
  test('guarda y devuelve unidad, categoría y urgente', async () => {
    const repo = makeRepo();
    const result = await new AddItemToListUseCase(repo, getHousehold).execute({
      list_id: 'list-1',
      name: 'Pañales',
      quantity: 2,
      unit: 'kg',
      category: 'cleaning',
      is_urgent: true,
      added_by: ANA,
    });

    const item = result.items[0];
    assert.equal(item.unit, 'kg');
    assert.equal(item.category, 'cleaning');
    assert.equal(item.is_urgent, true);
  });

  test('sin esos campos queda sin unidad y no urgente', async () => {
    const repo = makeRepo();
    const result = await new AddItemToListUseCase(repo, getHousehold).execute({
      list_id: 'list-1',
      name: 'Pan',
      quantity: 1,
      added_by: ANA,
    });

    const item = result.items[0];
    assert.equal(item.unit, null);
    assert.equal(item.is_urgent, false);
  });
});
