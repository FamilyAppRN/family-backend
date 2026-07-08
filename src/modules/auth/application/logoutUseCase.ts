import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { FirebaseAuthService } from '../domain/services/firebaseAuth.service.js';
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
        const user = await this.authRepository.findById(data.userId);
        if (user && user.firebase_uid) {
            await FirebaseAuthService.revokeTokens(user.firebase_uid);
        }
        return { success: true };
    }
}
