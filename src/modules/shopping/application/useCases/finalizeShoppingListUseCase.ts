import { Static } from '@sinclair/typebox';
import { UseCase } from '../../../../shared/application/useCase.js';
import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { FinalizeShoppingListInput, FinalizeShoppingListOutput } from '../schemas/shopping.schemas.js';
import { getAuthorizedList } from '../services/ShoppingAuthorization.js';

type Input = Static<typeof FinalizeShoppingListInput>;
type Output = Static<typeof FinalizeShoppingListOutput>;

export class FinalizeShoppingListUseCase extends UseCase<Input, Output> {
  protected inputSchema = FinalizeShoppingListInput;
  protected outputSchema = FinalizeShoppingListOutput;

  constructor(private readonly shoppingRepository: ShoppingRepository, private readonly getHouseholdUseCase: GetHouseholdUseCase) {
    super();
  }

  protected async implementation(data: Input): Promise<Output> {
    await getAuthorizedList(this.shoppingRepository, this.getHouseholdUseCase, data.list_id, data.user_id);
    return this.shoppingRepository.finalizeList(data.list_id, data.user_id);
  }
}
