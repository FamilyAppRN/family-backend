import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { DeleteShoppingListInput } from '../schemas/shopping.schemas.js';
import { Static, Type } from '@sinclair/typebox';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { getAuthorizedList } from '../services/ShoppingAuthorization.js';

type TInput = Static<typeof DeleteShoppingListInput>;

export class DeleteShoppingListUseCase extends UseCase<TInput, void> {
    protected inputSchema = DeleteShoppingListInput;
    protected outputSchema = Type.Void();

    constructor(private readonly shoppingRepository: ShoppingRepository, private readonly getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: TInput): Promise<void> {
        await getAuthorizedList(this.shoppingRepository, this.getHouseholdUseCase, data.list_id, data.user_id);
        await this.shoppingRepository.deleteList(data.list_id);
    }
}
