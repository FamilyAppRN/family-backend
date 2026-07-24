/**
 * Helper utilities to generate pure OpenAPI response blocks for Swagger documentation 
 * without enforcing strict TypeBox runtime validation which could accidentally strip fields.
 */

interface ErrorResponseOptions {
    code?: string;
    message?: string;
    category?: string;
}

/**
 * Generates an OpenAPI success response block (200, 201, etc).
 */
export const swaggerSuccess = (description: string, exampleData: any = null) => {
    return {
        description,
        content: {
            'application/json': {
                example: {
                    success: true,
                    message: description,
                    data: exampleData
                }
            }
        }
    };
};

/**
 * Generates an OpenAPI error response block (400, 401, 403, 404, 500, etc).
 */
export const swaggerError = (description: string, options: ErrorResponseOptions = {}) => {
    return {
        description,
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: options.message || description,
                    error: {
                        code: options.code || 'ERROR',
                        message: options.message || description,
                        category: options.category || 'GENERAL',
                        status: 400, // example generic status
                        details: {},
                        traceId: '123e4567-e89b-12d3-a456-426614174000'
                    }
                }
            }
        }
    };
};

/**
 * A standard set of common HTTP errors that can be appended to any endpoint's `detail.responses`.
 */
export const standardAuthErrors = {
    '401': swaggerError('No autorizado', { code: 'UNAUTHORIZED', message: 'Falta el token o es inválido', category: 'AUTH' }),
};

export const standardValidationErrors = {
    '400': swaggerError('Error de validación', { code: 'VALIDATION_ERROR', message: 'Los datos enviados son incorrectos', category: 'VALIDATION' }),
};

export const standardNotFoundErrors = {
    '404': swaggerError('No encontrado', { code: 'NOT_FOUND', message: 'El recurso solicitado no existe', category: 'NOT_FOUND' }),
};

/** Specific business errors **/

export const customAuthErrors = {
    userNotFound: swaggerError('Usuario no encontrado', { code: 'USER_NOT_FOUND', category: 'NOT_FOUND' }),
    invalidCredentials: swaggerError('Credenciales inválidas', { code: 'INVALID_CREDENTIALS', category: 'AUTHENTICATION' }),
    emailExists: swaggerError('Email ya registrado', { code: 'EMAIL_ALREADY_EXISTS', category: 'CONFLICT' }),
    userDisabled: swaggerError('El usuario ha sido deshabilitado', { code: 'USER_DISABLED', category: 'AUTHENTICATION' }),
    weakPassword: swaggerError('La contraseña debe tener al menos 6 caracteres', { code: 'INVALID_PASSWORD', category: 'VALIDATION' }),
};

export const customHouseholdErrors = {
    notFound: swaggerError('Hogar no encontrado', { code: 'NOT_FOUND_ERROR', category: 'NOT_FOUND' }),
    invalidInviteCode: swaggerError('Código de invitación inválido', { code: 'VALIDATION_ERROR', category: 'VALIDATION' }),
    userAlreadyInHousehold: swaggerError('El usuario ya pertenece al hogar', { code: 'CONFLICT_ERROR', category: 'BUSINESS' }),
    userNotInHousehold: swaggerError('El usuario no pertenece al hogar', { code: 'NOT_FOUND_ERROR', category: 'NOT_FOUND' }),
    ownerCannotLeave: swaggerError('El creador no puede abandonar el hogar', { code: 'FORBIDDEN_ERROR', category: 'BUSINESS' }),
    notAdmin: swaggerError('No tienes permisos de administrador', { code: 'FORBIDDEN_ERROR', category: 'BUSINESS' }),
};

export const customShoppingErrors = {
    listNotFound: swaggerError('Lista de compras no encontrada', { code: 'NOT_FOUND_ERROR', category: 'NOT_FOUND' }),
    itemNotFound: swaggerError('Item de compra no encontrado', { code: 'NOT_FOUND_ERROR', category: 'NOT_FOUND' }),
    activeListExists: swaggerError('El hogar ya tiene una lista de compras activa', { code: 'CONFLICT_ERROR', category: 'CONFLICT' }),
    purchaseNotReady: swaggerError('Todos los ítems deben estar comprados para finalizar', { code: 'PURCHASE_NOT_READY', category: 'BUSINESS' }),
};

export const customTaskErrors = {
    notFound: swaggerError('Tarea no encontrada', { code: 'NOT_FOUND_ERROR', category: 'NOT_FOUND' }),
};

export const customNoteErrors = {
    notFound: swaggerError('Nota no encontrada', { code: 'NOT_FOUND_ERROR', category: 'NOT_FOUND' }),
    forbidden: swaggerError('No tienes permiso para modificar esta nota', { code: 'FORBIDDEN_ERROR', category: 'BUSINESS' }),
};
