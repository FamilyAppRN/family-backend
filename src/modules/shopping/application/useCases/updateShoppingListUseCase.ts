import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { UpdateShoppingListInput, ShoppingListSchema, TShoppingList } from '../schemas/shopping.schemas.js';
import { Static } from '@sinclair/typebox';

type TInput = Static<typeof UpdateShoppingListInput>;

export class UpdateShoppingListUseCase extends UseCase<TInput, TShoppingList> {
    protected inputSchema = UpdateShoppingListInput;
    protected outputSchema = ShoppingListSchema;

    constructor(private readonly shoppingRepository: ShoppingRepository) {
        super();
    }

    protected async implementation(data: TInput): Promise<TShoppingList> {
        const updateData: Partial<{ name: string; status: 'active' | 'archived' }> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.status !== undefined) updateData.status = data.status;

        return await this.shoppingRepository.updateList(data.list_id, updateData);
    }
}
