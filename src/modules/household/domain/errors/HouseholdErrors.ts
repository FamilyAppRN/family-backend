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

export class LimitReachedCreateHouseholdError extends ApplicationError {
    constructor() {
        super(403, "Tu plan no permite crear más hogares", "LIMIT_REACHED_CREATE_HOUSEHOLD", "BUSINESS");
    }
}

export class LimitReachedJoinHouseholdError extends ApplicationError {
    constructor() {
        super(403, "Tu plan no permite estar en más hogares", "LIMIT_REACHED_JOIN_HOUSEHOLD", "BUSINESS");
    }
}

export class HouseholdFullError extends ApplicationError {
    constructor() {
        super(422, "El hogar alcanzó el máximo de miembros de su plan", "HOUSEHOLD_FULL", "BUSINESS");
    }
}

export class PlanRequiredError extends ApplicationError {
    constructor() {
        super(403, "Esta función requiere que el hogar sea Premium", "PLAN_REQUIRED", "BUSINESS");
    }
}
