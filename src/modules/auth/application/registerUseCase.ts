import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { EmailAlreadyExistsError } from '../domain/errors/auth.errors.js';
import { registerRequestSchema, authResponseSchema } from './schemas/auth.schemas.js';
import { PasswordService } from '../domain/services/password.service.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../../../config/env.js';

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

        // Fase 1: SHA-256(email:password) → Fase 2: bcrypt(derivado, saltRounds)
        // Esto garantiza que la misma contraseña en cuentas distintas genera hashes distintos
        const { hash, saltRounds } = await PasswordService.hash(data.email, data.password);
        
        const user = await this.authRepository.create({
            email: data.email,
            password_hash: hash,
            password_salt_rounds: saltRounds,
            name: data.name,
            plan: 'free',
            notifications_enabled: true
        });

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, plan: user.plan },
            ENV.JWT_SECRET,
            { expiresIn: ENV.JWT_EXPIRES_IN as any }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            ENV.JWT_SECRET,
            { expiresIn: ENV.REFRESH_TOKEN_EXPIRES_IN as any }
        );

        const refreshExpires = new Date();
        refreshExpires.setDate(refreshExpires.getDate() + 30);
        await this.authRepository.saveRefreshToken(user.id, refreshToken, refreshExpires);

        return {
            user,
            accessToken,
            refreshToken
        };
    }
}
