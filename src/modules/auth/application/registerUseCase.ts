import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { EmailAlreadyExistsError } from '../domain/errors/auth.errors.js';
import { registerRequestSchema, authResponseSchema } from './schemas/auth.schemas.js';
import { FirebaseAuthService } from '../domain/services/firebaseAuth.service.js';

export class RegisterUseCase extends UseCase<any, any> {
    protected inputSchema = registerRequestSchema;
    protected outputSchema = authResponseSchema;

    constructor(private authRepository: AuthRepository) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        const existingUser = await this.authRepository.findByEmail(data.email);
        if (existingUser) {
            throw new EmailAlreadyExistsError();
        }

        let firebaseUid: string | null = null;
        try {
            // 1. Create user in Firebase Auth
            firebaseUid = await FirebaseAuthService.createUser(data.email, data.password, data.name);
            
            // 2. Create profile in MongoDB
            const user = await this.authRepository.create({
                firebase_uid: firebaseUid,
                email: data.email,
                name: data.name,
                plan: 'free',
                notifications_enabled: true
            });

            // 3. Login to get tokens
            const credentials = await FirebaseAuthService.signIn(data.email, data.password);

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
        } catch (error) {
            // Rollback Firebase user if DB creation fails
            if (firebaseUid) {
                await FirebaseAuthService.deleteUser(firebaseUid);
            }
            throw error;
        }
    }
}
