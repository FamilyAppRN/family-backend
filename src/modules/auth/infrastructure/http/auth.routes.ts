import { Elysia } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { RegisterUseCase } from '../../application/registerUseCase.js';
import { LoginUseCase } from '../../application/loginUseCase.js';
import { RefreshTokenUseCase } from '../../application/refreshTokenUseCase.js';
import { LogoutUseCase } from '../../application/logoutUseCase.js';
import { MongooseAuthRepository } from '../persistence/MongooseAuthRepository.js';
import { 
    registerRequestSchema, 
    loginRequestSchema, 
    refreshTokenRequestSchema, 
    pushTokenRequestSchema 
} from '../../application/schemas/auth.schemas.js';

export const authRoutes = new Elysia()
    .group('/auth', (app) =>
        app
            .post('/register', async ({ body, set }) => {
                const repository = new MongooseAuthRepository();
                const useCase = new RegisterUseCase(repository);
                const result = await useCase.execute(body);
                
                const response = ApiResponse.success(result, "Usuario registrado exitosamente", 201);
                set.status = response.status;
                return response.body;
            }, {
                body: registerRequestSchema,
            })

            .post('/login', async ({ body, set }) => {
                const repository = new MongooseAuthRepository();
                const useCase = new LoginUseCase(repository);
                const result = await useCase.execute(body);
                
                const response = ApiResponse.success(result, "Login exitoso", 200);
                set.status = response.status;
                return response.body;
            }, {
                body: loginRequestSchema,
            })

            .post('/refresh', async ({ body, set }) => {
                const repository = new MongooseAuthRepository();
                const useCase = new RefreshTokenUseCase(repository);
                const result = await useCase.execute(body);
                
                const response = ApiResponse.success(result, "Token renovado exitosamente", 200);
                set.status = response.status;
                return response.body;
            }, {
                body: refreshTokenRequestSchema,
            })
    )
    .group('', (app) =>
        app
            .use(authMiddleware)
            .post('/auth/logout', async (ctx: any) => {
                const { user, body, set } = ctx;
                const repository = new MongooseAuthRepository();
                const useCase = new LogoutUseCase(repository);
                const result = await useCase.execute({ 
                    userId: user.id, 
                    refreshToken: (body as any)?.refreshToken 
                });
                
                const response = ApiResponse.success(result, "Logout exitoso", 200);
                set.status = response.status;
                return response.body;
            })

            .patch('/users/me/push-token', async (ctx: any) => {
                const { user, body, set } = ctx;
                const repository = new MongooseAuthRepository();
                await repository.addPushToken(user.id, (body as any).token);
                
                const response = ApiResponse.success(null, "Push token actualizado", 200);
                set.status = response.status;
                return response.body;
            }, {
                body: pushTokenRequestSchema,
            })

            .delete('/users/me/push-token', async (ctx: any) => {
                const { user, body, set } = ctx;
                const repository = new MongooseAuthRepository();
                await repository.deletePushToken(user.id, (body as any).token);
                
                const response = ApiResponse.success(null, "Push token eliminado", 200);
                set.status = response.status;
                return response.body;
            }, {
                body: pushTokenRequestSchema,
            })
    );
