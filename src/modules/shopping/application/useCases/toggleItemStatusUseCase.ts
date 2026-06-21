import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { ToggleItemStatusInput, ShoppingListSchema, TShoppingList } from '../schemas/shopping.schemas.js';
import { Static } from '@sinclair/typebox';

type TInput = Static<typeof ToggleItemStatusInput>;

export class ToggleItemStatusUseCase extends UseCase<TInput, TShoppingList> {
    protected inputSchema = ToggleItemStatusInput;
    protected outputSchema = ShoppingListSchema;

    constructor(private readonly shoppingRepository: ShoppingRepository) {
        super();
    }

    protected async implementation(data: TInput): Promise<TShoppingList> {
        return await this.shoppingRepository.toggleItemStatus(
            data.list_id,
            data.item_id,
            data.is_completed,
            data.userId
        );
    }
}
