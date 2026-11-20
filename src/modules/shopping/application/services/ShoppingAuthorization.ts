import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership } from '../../../household/application/services/HouseholdMembership.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { ListNotFoundError } from '../../domain/errors/ShoppingErrors.js';

export { assertHouseholdMembership };

export async function getAuthorizedList(
  shoppingRepository: ShoppingRepository,
  getHouseholdUseCase: GetHouseholdUseCase,
  listId: string,
  userId: string,
) {
  const list = await shoppingRepository.getListById(listId);
  if (!list) throw new ListNotFoundError();
  await assertHouseholdMembership(getHouseholdUseCase, list.household_id, userId);
  return list;
}
