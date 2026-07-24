import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { UpdateShoppingListInput, ShoppingListSchema, TShoppingList } from '../schemas/shopping.schemas.js';
import { Static } from '@sinclair/typebox';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { getAuthorizedList } from '../services/ShoppingAuthorization.js';

type TInput = Static<typeof UpdateShoppingListInput>;

export class UpdateShoppingListUseCase extends UseCase<TInput, TShoppingList> {
    protected inputSchema = UpdateShoppingListInput;
    protected outputSchema = ShoppingListSchema;

    constructor(private readonly shoppingRepository: ShoppingRepository, private readonly getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: TInput): Promise<TShoppingList> {
        await getAuthorizedList(this.shoppingRepository, this.getHouseholdUseCase, data.list_id, data.user_id);
        const updateData: Partial<{ name: string }> = {};
        if (data.name !== undefined) updateData.name = data.name;

        return await this.shoppingRepository.updateList(data.list_id, updateData);
    }
}
