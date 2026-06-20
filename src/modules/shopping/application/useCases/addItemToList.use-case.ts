import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { AddItemToListInput, ShoppingListSchema, TShoppingList } from '../schemas/shopping.schemas.js';
import { Static } from '@sinclair/typebox';

type TInput = Static<typeof AddItemToListInput>;

export class AddItemToListUseCase extends UseCase<TInput, TShoppingList> {
    protected inputSchema = AddItemToListInput;
    protected outputSchema = ShoppingListSchema;

    constructor(private readonly shoppingRepository: ShoppingRepository) {
        super();
    }

    protected async implementation(data: TInput): Promise<TShoppingList> {
        return await this.shoppingRepository.addItemToList(data.list_id, {
            name: data.name,
            quantity: data.quantity,
            added_by: data.added_by
        });
    }
}
