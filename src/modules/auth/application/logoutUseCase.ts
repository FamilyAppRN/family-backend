import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { t } from 'elysia';

export class LogoutUseCase extends UseCase<any, any> {
    protected inputSchema = t.Object({
        userId: t.String(),
        refreshToken: t.Optional(t.String())
    });
    protected outputSchema = t.Object({
        success: t.Boolean()
    });

    constructor(private authRepository: AuthRepository) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        if (data.refreshToken) {
            await this.authRepository.deleteRefreshToken(data.refreshToken);
        } else {
            await this.authRepository.deleteAllUserRefreshTokens(data.userId);
        }

        return { success: true };
    }
}
