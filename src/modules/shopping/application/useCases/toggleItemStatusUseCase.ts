import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { ToggleItemStatusInput, ShoppingListSchema, TShoppingList } from '../schemas/shopping.schemas.js';
import { Static } from '@sinclair/typebox';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { getAuthorizedList } from '../services/ShoppingAuthorization.js';

type TInput = Static<typeof ToggleItemStatusInput>;

export class ToggleItemStatusUseCase extends UseCase<TInput, TShoppingList> {
    protected inputSchema = ToggleItemStatusInput;
    protected outputSchema = ShoppingListSchema;

    constructor(private readonly shoppingRepository: ShoppingRepository, private readonly getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: TInput): Promise<TShoppingList> {
        await getAuthorizedList(this.shoppingRepository, this.getHouseholdUseCase, data.list_id, data.userId);
        return await this.shoppingRepository.toggleItemStatus(
            data.list_id,
            data.item_id,
            data.is_completed,
            data.userId
        );
    }
}
