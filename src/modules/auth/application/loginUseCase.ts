import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { InvalidCredentialsError } from '../domain/errors/auth.errors.js';
import { loginRequestSchema, authResponseSchema } from './schemas/auth.schemas.js';
import { PasswordService } from '../domain/services/password.service.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../../../config/env.js';

export class LoginUseCase extends UseCase<any, any> {
    protected inputSchema = loginRequestSchema;
    protected outputSchema = authResponseSchema;

    constructor(private authRepository: AuthRepository) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        const user = await this.authRepository.findByEmail(data.email);
        if (!user || !user.password_hash) {
            throw new InvalidCredentialsError();
        }

        // Verifica usando el mismo pre-hash: SHA-256(email:password) → bcrypt.compare
        const isMatch = await PasswordService.verify(data.email, data.password, user.password_hash);
        if (!isMatch) {
            throw new InvalidCredentialsError();
        }

        // Migración progresiva: si los rounds guardados son menores a los actuales, re-hashea
        if (user.password_salt_rounds && PasswordService.needsRehash(user.password_salt_rounds)) {
            const { hash, saltRounds } = await PasswordService.hash(data.email, data.password);
            await this.authRepository.update(user.id, { 
                password_hash: hash, 
                password_salt_rounds: saltRounds 
            });
        }

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
            accessToken,
            refreshToken
        };
    }
}
