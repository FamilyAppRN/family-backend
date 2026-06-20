import { ApplicationError } from '../../../../shared/domain/error.js';

export class HouseholdNotFoundError extends ApplicationError {
    constructor() {
        super(404, "Hogar no encontrado", "NOT_FOUND_ERROR", "NOT_FOUND");
    }
}

export class InvalidInviteCodeError extends ApplicationError {
    constructor() {
        super(400, "Código de invitación inválido", "VALIDATION_ERROR", "VALIDATION");
    }
}

export class UserAlreadyInHouseholdError extends ApplicationError {
    constructor() {
        super(409, "El usuario ya pertenece al hogar", "CONFLICT_ERROR", "BUSINESS");
    }
}

export class UserNotInHouseholdError extends ApplicationError {
    constructor() {
        super(404, "El usuario no pertenece al hogar", "NOT_FOUND_ERROR", "NOT_FOUND");
    }
}

export class OwnerCannotLeaveError extends ApplicationError {
    constructor() {
        super(403, "El creador del hogar no puede abandonarlo. Debe eliminar el hogar o transferir la propiedad.", "FORBIDDEN_ERROR", "BUSINESS");
    }
}

export class NotHouseholdAdminError extends ApplicationError {
    constructor() {
        super(403, "No tienes permisos de administrador en este hogar", "FORBIDDEN_ERROR", "BUSINESS");
    }
}
