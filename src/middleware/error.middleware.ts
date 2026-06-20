import { Elysia } from 'elysia';
import { AppError } from '../shared/AppError.js';

export const errorMiddleware = new Elysia()
  .onError(({ code, error, set }) => {
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        status: 'error',
        code: error.errorCode,
        message: error.message,
      };
    }

    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Error de validación en la solicitud',
        errors: (error as any).all || error.message,
      };
    }

    console.error('Unhandled server error:', error);
    set.status = 500;
    return {
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Algo salió mal en el servidor',
    };
  });
