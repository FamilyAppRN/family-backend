import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { GetShoppingListsInput, ShoppingListSchema, TShoppingList } from '../schemas/shopping.schemas.js';
import { Static, Type } from '@sinclair/typebox';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership } from '../services/ShoppingAuthorization.js';

type TInput = Static<typeof GetShoppingListsInput>;

export class GetShoppingListsUseCase extends UseCase<TInput, TShoppingList[]> {
    protected inputSchema = GetShoppingListsInput;
    protected outputSchema = Type.Array(ShoppingListSchema);

    constructor(private readonly shoppingRepository: ShoppingRepository, private readonly getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: TInput): Promise<TShoppingList[]> {
        await assertHouseholdMembership(this.getHouseholdUseCase, data.household_id, data.user_id);
        return await this.shoppingRepository.getListsByHousehold(data.household_id, data.status);
    }
}
