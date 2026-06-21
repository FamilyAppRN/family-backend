import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { UserNotFoundError } from '../domain/errors/auth.errors.js';
import { validateSessionInputSchema, userResponseSchema } from './schemas/auth.schemas.js';

export class ValidateSessionUseCase extends UseCase<any, any> {
    protected inputSchema = validateSessionInputSchema;
    protected outputSchema = userResponseSchema;

    constructor(private authRepository: AuthRepository) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        const user = await this.authRepository.findById(data.userId);
        if (!user) {
            throw new UserNotFoundError();
        }
        return user;
    }
}
