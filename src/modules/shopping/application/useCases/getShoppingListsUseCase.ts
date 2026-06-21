import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { GetShoppingListsInput, ShoppingListSchema, TShoppingList } from '../schemas/shopping.schemas.js';
import { Static, Type } from '@sinclair/typebox';

type TInput = Static<typeof GetShoppingListsInput>;

export class GetShoppingListsUseCase extends UseCase<TInput, TShoppingList[]> {
    protected inputSchema = GetShoppingListsInput;
    protected outputSchema = Type.Array(ShoppingListSchema);

    constructor(private readonly shoppingRepository: ShoppingRepository) {
        super();
    }

    protected async implementation(data: TInput): Promise<TShoppingList[]> {
        return await this.shoppingRepository.getListsByHousehold(data.household_id);
    }
}
