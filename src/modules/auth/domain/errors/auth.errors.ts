import { ApplicationError } from '../../../../shared/domain/error.js';

export class UserNotFoundError extends ApplicationError {
    constructor() {
        super(404, 'Usuario no encontrado', 'USER_NOT_FOUND', 'NOT_FOUND');
    }
}

export class InvalidCredentialsError extends ApplicationError {
    constructor() {
        super(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS', 'AUTHENTICATION');
    }
}

export class EmailAlreadyExistsError extends ApplicationError {
    constructor() {
        super(409, 'El correo electrónico ya está registrado', 'EMAIL_ALREADY_EXISTS', 'CONFLICT');
    }
}

export class InvalidTokenError extends ApplicationError {
    constructor() {
        super(401, 'Token inválido o expirado', 'INVALID_TOKEN', 'AUTHENTICATION');
    }
}
