import { UseCase } from '../../../../shared/application/useCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { CreateShoppingListInput, ShoppingListSchema, TShoppingList } from '../schemas/shopping.schemas.js';
import { Static } from '@sinclair/typebox';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership } from '../services/ShoppingAuthorization.js';

type TInput = Static<typeof CreateShoppingListInput>;

export class CreateShoppingListUseCase extends UseCase<TInput, TShoppingList> {
    protected inputSchema = CreateShoppingListInput;
    protected outputSchema = ShoppingListSchema;

    constructor(private readonly shoppingRepository: ShoppingRepository, private readonly getHouseholdUseCase: GetHouseholdUseCase) {
        super();
    }

    protected async implementation(data: TInput): Promise<TShoppingList> {
        await assertHouseholdMembership(this.getHouseholdUseCase, data.household_id, data.created_by);
        return await this.shoppingRepository.createList({
            household_id: data.household_id,
            name: data.name,
            created_by: data.created_by,
        });
    }
}
