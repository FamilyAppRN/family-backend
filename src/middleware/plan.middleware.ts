import { AppError } from '../shared/AppError.js';

export const requirePlan = (requiredPlan: 'premium') => {
  return ({ user }: { user?: { plan: string } }) => {
    if (!user) {
      throw new AppError('No autorizado: Contexto de usuario no encontrado', 401, 'UNAUTHORIZED');
    }
    if (user.plan !== requiredPlan) {
      throw new AppError('Esta función requiere plan Premium', 403, 'PLAN_REQUIRED');
    }
  };
};
