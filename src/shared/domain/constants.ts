/**
 * Expresión regular global para validación de contraseñas.
 * 
 * Requisitos:
 * - Al menos 8 caracteres de longitud.
 * - Al menos una letra minúscula.
 * - Al menos una letra mayúscula.
 * - Al menos un número.
 * - Al menos un carácter especial de los siguientes: @$!%*?&
 */
export const PASSWORD_REGEX = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$';
