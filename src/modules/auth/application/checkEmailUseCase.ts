import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { checkEmailRequestSchema, checkEmailResponseSchema } from './schemas/auth.schemas.js';

export class CheckEmailUseCase extends UseCase<any, any> {
    protected inputSchema = checkEmailRequestSchema;
    protected outputSchema = checkEmailResponseSchema;

    constructor(private authRepository: AuthRepository) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        const user = await this.authRepository.findByEmail(data.email);
        return { exists: !!user };
    }
}
