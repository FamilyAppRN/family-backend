import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { UserNotFoundError } from '../domain/errors/auth.errors.js';
import { loginRequestSchema, authResponseSchema } from './schemas/auth.schemas.js';
import { FirebaseAuthService } from '../domain/services/firebaseAuth.service.js';

export class LoginUseCase extends UseCase<any, any> {
    protected inputSchema = loginRequestSchema;
    protected outputSchema = authResponseSchema;

    constructor(private authRepository: AuthRepository) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        // 1. Authenticate with Firebase Auth REST API
        const credentials = await FirebaseAuthService.signIn(data.email, data.password);

        // 2. Fetch user from MongoDB using the Firebase UID
        const user = await this.authRepository.findByFirebaseUid(credentials.uid);
        if (!user) {
            throw new UserNotFoundError();
        }

        return {
            accessToken: credentials.idToken,
            refreshToken: credentials.refreshToken,
            user: {
                id: user.id,
                firebase_uid: user.firebase_uid,
                email: user.email,
                name: user.name,
                plan: user.plan,
                plan_expires_at: user.plan_expires_at,
                push_tokens: user.push_tokens,
                notifications_enabled: user.notifications_enabled,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        };
    }
}
