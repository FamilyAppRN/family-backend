import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { DeleteShoppingListInput } from '../schemas/shopping.schemas.js';
import { Static, Type } from '@sinclair/typebox';

type TInput = Static<typeof DeleteShoppingListInput>;

export class DeleteShoppingListUseCase extends UseCase<TInput, void> {
    protected inputSchema = DeleteShoppingListInput;
    protected outputSchema = Type.Void();

    constructor(private readonly shoppingRepository: ShoppingRepository) {
        super();
    }

    protected async implementation(data: TInput): Promise<void> {
        await this.shoppingRepository.deleteList(data.list_id);
    }
}
