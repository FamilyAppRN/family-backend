import { ApplicationError } from '../shared/domain/error.js';

export const requirePlan = (requiredPlan: 'premium') => {
  return ({ user }: { user?: { plan: string } }) => {
    if (!user) {
      throw new ApplicationError(401, 'No autorizado: Contexto de usuario no encontrado', 'AUTH_MISSING_TOKEN', 'AUTHENTICATION');
    }
    if (user.plan !== requiredPlan) {
      throw new ApplicationError(403, 'Esta función requiere plan Premium', 'AUTHORIZATION_ERROR', 'AUTHORIZATION');
    }
  };
};
