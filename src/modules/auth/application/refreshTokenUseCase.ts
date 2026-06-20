import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { InvalidTokenError } from '../domain/errors/auth.errors.js';
import { refreshTokenRequestSchema, tokenResponseSchema } from './schemas/auth.schemas.js';
import { TSchema } from '@sinclair/typebox';
import jwt from 'jsonwebtoken';
import { ENV } from '../../../config/env.js';

export class RefreshTokenUseCase extends UseCase<any, any> {
    protected inputSchema = refreshTokenRequestSchema;
    protected outputSchema = tokenResponseSchema;

    constructor(private authRepository: AuthRepository) {
        super();
    }

    protected async implementation(data: any): Promise<any> {
        const tokenDoc = await this.authRepository.findRefreshToken(data.refreshToken);
        if (!tokenDoc) {
            throw new InvalidTokenError();
        }

        try {
            const decoded = jwt.verify(data.refreshToken, ENV.JWT_SECRET) as any;
            const user = await this.authRepository.findById(decoded.userId);
            
            if (!user) {
                throw new InvalidTokenError();
            }

            const accessToken = jwt.sign(
                { userId: user.id, email: user.email, plan: user.plan },
                ENV.JWT_SECRET,
                { expiresIn: ENV.JWT_EXPIRES_IN as any }
            );

            return { accessToken };
        } catch (error) {
            await this.authRepository.deleteRefreshToken(data.refreshToken);
            throw new InvalidTokenError();
        }
    }
}
