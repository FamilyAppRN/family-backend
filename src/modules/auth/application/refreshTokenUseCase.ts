import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { InvalidTokenError } from '../domain/errors/auth.errors.js';
import { refreshTokenRequestSchema, tokenResponseSchema } from './schemas/auth.schemas.js';
import { FirebaseAuthService } from '../domain/services/firebaseAuth.service.js';

export class RefreshTokenUseCase extends UseCase<any, any> {
    protected inputSchema = refreshTokenRequestSchema;
    protected outputSchema = tokenResponseSchema;

    constructor(private authRepository: AuthRepository) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        try {
            const result = await FirebaseAuthService.refreshToken(data.refreshToken);
            return {
                accessToken: result.idToken,
                refreshToken: result.refreshToken,
            };
        } catch (error) {
            throw new InvalidTokenError();
        }
    }
}
