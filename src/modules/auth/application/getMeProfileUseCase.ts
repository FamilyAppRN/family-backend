import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { GetUserHouseholdsUseCase } from '../../household/application/useCases/getUserHouseholdsUseCase.js';
import { UserNotFoundError } from '../domain/errors/auth.errors.js';
import { meProfileInputSchema, meProfileResponseSchema } from './schemas/auth.schemas.js';

export class GetMeProfileUseCase extends UseCase<any, any> {
    protected inputSchema = meProfileInputSchema;
    protected outputSchema = meProfileResponseSchema;

    constructor(
        private authRepository: AuthRepository,
        private getUserHouseholdsUseCase: GetUserHouseholdsUseCase
    ) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        const user = await this.authRepository.findById(data.userId);
        if (!user) {
            throw new UserNotFoundError();
        }

        const households = await this.getUserHouseholdsUseCase.execute({ userId: data.userId });

        return {
            user,
            households,
        };
    }
}
