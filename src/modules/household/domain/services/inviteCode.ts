import crypto from 'crypto';

/** 6 caracteres hex en mayúsculas (ej. 7F3A9C), el formato que espera la app. */
export function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}
