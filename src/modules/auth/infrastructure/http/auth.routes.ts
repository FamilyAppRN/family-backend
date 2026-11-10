import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../../../middleware/auth.middleware.js';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { RegisterUseCase } from '../../application/registerUseCase.js';
import { LoginUseCase } from '../../application/loginUseCase.js';
import { RefreshTokenUseCase } from '../../application/refreshTokenUseCase.js';
import { LogoutUseCase } from '../../application/logoutUseCase.js';
import { CheckEmailUseCase } from '../../application/checkEmailUseCase.js';
import { ValidateSessionUseCase } from '../../application/validateSessionUseCase.js';
import { GetMeProfileUseCase } from '../../application/getMeProfileUseCase.js';
import { GetUserHouseholdsUseCase } from '../../../household/application/useCases/getUserHouseholdsUseCase.js';
import { GoogleLoginUseCase } from '../../application/googleLoginUseCase.js';
import { AppleLoginUseCase } from '../../application/appleLoginUseCase.js';
import { MongooseAuthRepository } from '../persistence/MongooseAuthRepository.js';
import { MongooseHouseholdRepository } from '../../../household/infrastructure/persistence/MongooseHouseholdRepository.js';
import {
    registerRequestSchema,
    loginRequestSchema,
    refreshTokenRequestSchema,
    pushTokenRequestSchema,
    checkEmailRequestSchema,
    googleLoginRequestSchema,
    appleLoginRequestSchema
} from '../../application/schemas/auth.schemas.js';
import { swaggerSuccess, swaggerError, standardAuthErrors, standardValidationErrors, customAuthErrors } from '../../../../shared/infrastructure/http/swaggerResponses.js';

export const authRoutes = new Elysia({ detail: { tags: ['Auth'] } })
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
                detail: { 
                    summary: 'Registrar un nuevo usuario',
                    responses: {
                        '201': swaggerSuccess("Usuario registrado exitosamente", { user: { id: "user-123", name: "John", email: "john@test.com" }, accessToken: "ey...", refreshToken: "ey..." }),
                        ...standardValidationErrors,
                        '400': customAuthErrors.weakPassword,
                        '409': customAuthErrors.emailExists
                    }
                }
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
                detail: {
                    summary: 'Iniciar sesión',
                    responses: {
                        '200': swaggerSuccess("Login exitoso", { user: { id: "user-123", name: "John", email: "john@test.com" }, accessToken: "ey...", refreshToken: "ey..." }),
                        ...standardValidationErrors,
                        '401': customAuthErrors.invalidCredentials,
                        '403': customAuthErrors.userDisabled,
                        '404': customAuthErrors.userNotFound
                    }
                }
            })

            .post('/google', async ({ body, set }) => {
                const repository = new MongooseAuthRepository();
                const useCase = new GoogleLoginUseCase(repository);
                const result = await useCase.execute(body);

                const response = ApiResponse.success(result, "Inicio de sesión con Google exitoso", 200);
                set.status = response.status;
                return response.body;
            }, {
                body: googleLoginRequestSchema,
                detail: {
                    summary: 'Iniciar sesión con Google',
                    responses: {
                        '200': swaggerSuccess("Inicio de sesión con Google exitoso", { user: { id: "user-123", name: "John", email: "john@test.com" }, accessToken: "ey...", refreshToken: "ey..." }),
                        ...standardValidationErrors,
                        '400': customAuthErrors.invalidCredentials,
                        '401': customAuthErrors.invalidCredentials,
                        '403': customAuthErrors.userDisabled,
                        '500': customAuthErrors.internalError
                    }
                }
            })

            .post('/apple', async ({ body, set }) => {
                const repository = new MongooseAuthRepository();
                const useCase = new AppleLoginUseCase(repository);
                const result = await useCase.execute(body);

                const response = ApiResponse.success(result, "Inicio de sesión con Apple exitoso", 200);
                set.status = response.status;
                return response.body;
            }, {
                body: appleLoginRequestSchema,
                detail: {
                    summary: 'Iniciar sesión con Apple',
                    responses: {
                        '200': swaggerSuccess("Inicio de sesión con Apple exitoso", { user: { id: "user-123", name: "John", email: "john@test.com" }, accessToken: "ey...", refreshToken: "ey..." }),
                        ...standardValidationErrors,
                        '400': customAuthErrors.invalidCredentials,
                        '401': customAuthErrors.invalidCredentials,
                        '403': customAuthErrors.userDisabled,
                        '500': customAuthErrors.internalError
                    }
                }
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
                detail: {
                    summary: 'Refrescar token de acceso',
                    responses: {
                        '200': swaggerSuccess("Token renovado exitosamente", { accessToken: "ey...", refreshToken: "ey..." }),
                        ...standardValidationErrors,
                        ...standardAuthErrors
                    }
                }
            })

            .post('/check-email', async ({ body, set }) => {
                const repository = new MongooseAuthRepository();
                const useCase = new CheckEmailUseCase(repository);
                const result = await useCase.execute(body);

                const response = ApiResponse.success(result, "Verificación de email", 200);
                set.status = response.status;
                return response.body;
            }, {
                body: checkEmailRequestSchema,
                detail: {
                    summary: 'Verificar disponibilidad de email',
                    responses: {
                        '200': swaggerSuccess("Verificación de email", { available: true }),
                        ...standardValidationErrors
                    }
                }
            })
    )
    .group('', (app) =>
        app
            .use(authMiddleware)
            .get('/auth/session', async (ctx: any) => {
                const { user, set } = ctx;
                const repository = new MongooseAuthRepository();
                const useCase = new ValidateSessionUseCase(repository);
                const result = await useCase.execute({ userId: user.id });
                
                const response = ApiResponse.success(result, "Sesión activa", 200);
                set.status = response.status;
                return response.body;
            }, {
                detail: { 
                    summary: 'Validar sesión actual',
                    responses: {
                        '200': swaggerSuccess("Sesión activa", null),
                        ...standardAuthErrors
                    }
                }
            })
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
            }, {
                detail: { 
                    summary: 'Cerrar sesión',
                    responses: {
                        '200': swaggerSuccess("Logout exitoso", null),
                        ...standardAuthErrors
                    }
                }
            })

            .get('/users/me', async (ctx: any) => {
                const { user, set } = ctx;
                const authRepository = new MongooseAuthRepository();
                const householdRepository = new MongooseHouseholdRepository();
                const getUserHouseholdsUseCase = new GetUserHouseholdsUseCase(householdRepository);
                const useCase = new GetMeProfileUseCase(authRepository, getUserHouseholdsUseCase);
                const result = await useCase.execute({ userId: user.id });
                
                const response = ApiResponse.success(result, "Perfil del usuario", 200);
                set.status = response.status;
                return response.body;
            }, {
                detail: { 
                    summary: 'Obtener perfil del usuario',
                    responses: {
                        '200': swaggerSuccess("Perfil del usuario", { user: { id: "user-123", email: "john@test.com" }, households: [{ id: "hh-123", name: "Mi Hogar", role: "owner" }] }),
                        ...standardAuthErrors
                    }
                }
            })

            .patch('/users/me', async (ctx: any) => {
                const { user, body, set } = ctx;
                const repository = new MongooseAuthRepository();
                const updated = await repository.update(user.id, { notifications_enabled: body.notifications_enabled });

                const response = ApiResponse.success({ notifications_enabled: updated.notifications_enabled }, "Preferencias actualizadas", 200);
                set.status = response.status;
                return response.body;
            }, {
                body: t.Object({ notifications_enabled: t.Boolean() }),
                detail: {
                    summary: 'Activar o desactivar las notificaciones push',
                    responses: {
                        '200': swaggerSuccess("Preferencias actualizadas", { notifications_enabled: false }),
                        ...standardValidationErrors,
                        ...standardAuthErrors
                    }
                }
            })

                        .patch('/users/me/push-token', async (ctx: any) => {
                const { user, body, set } = ctx;
                const repository = new MongooseAuthRepository();
                await repository.addPushToken(user.id, (body as any).token, (body as any).device_label);
                
                const response = ApiResponse.success(null, "Push token actualizado", 200);
                set.status = response.status;
                return response.body;
            }, {
                body: pushTokenRequestSchema,
                detail: { 
                    summary: 'Actualizar token push',
                    responses: {
                        '200': swaggerSuccess("Push token actualizado", null),
                        ...standardValidationErrors,
                        ...standardAuthErrors
                    }
                }
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
                detail: { 
                    summary: 'Eliminar token push',
                    responses: {
                        '200': swaggerSuccess("Push token eliminado", null),
                        ...standardValidationErrors,
                        ...standardAuthErrors
                    }
                }
            })
    );
