import { Elysia } from 'elysia';
import { ApplicationError, ValidationError } from '../shared/domain/error.js';
import { randomUUID } from 'crypto';
import logger from '../shared/infrastructure/logger.js';

export const errorMiddleware = new Elysia({ name: 'error-middleware' })
  .error('ApplicationError', ApplicationError)
  .onError({ as: 'global' }, ({ code, error, set, request }) => {
    try {
      const traceId = request?.headers?.get('x-trace-id') || randomUUID();

      if (code === 'ApplicationError' || error instanceof ApplicationError || (error as any).isOperational) {
        const appError = error as ApplicationError;
        const details = appError.name === 'ValidationError' ? appError.details : appError.details;
        
        logger.error({ err: appError, traceId, code: appError.code, category: appError.category }, appError.message);
        
        set.status = appError.statusCode || 500;
        return {
          success: false,
          error: {
            code: appError.code,
            message: appError.message,
            category: appError.category,
            status: appError.statusCode || 500,
            details: details || {},
            traceId
          },
          message: appError.message
        };
      }

      if (code === 'VALIDATION') {
        logger.warn({ err: error, traceId, code: 'VALIDATION_ERROR', category: 'VALIDATION' }, 'Elysia Route Validation Failed');
        
        let simplifiedDetails: Record<string, string> = {};
        const validationErrors = (error as any).all;
        
        if (Array.isArray(validationErrors)) {
            for (const e of validationErrors) {
                const field = e.path ? e.path.replace(/^[/.]/, '') : 'unknown';
                if (!simplifiedDetails[field]) {
                    simplifiedDetails[field] = e.schema?.error || e.message || 'Valor inválido';
                }
            }
        } else {
            simplifiedDetails = { error: error.message };
        }

        set.status = 400;
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Error de validación en la solicitud',
            category: 'VALIDATION',
            status: 400,
            details: simplifiedDetails,
            traceId
          },
          message: 'Error de validación en la solicitud'
        };
      }

      if (code === 'NOT_FOUND') {
        // Do not log NOT_FOUND as an error to avoid spamming the console with Socket.IO polling requests
        set.status = 404;
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Ruta no encontrada',
            category: 'NOT_FOUND',
            status: 404,
            details: {},
            traceId
          },
          message: 'Ruta no encontrada'
        };
      }

      logger.error({ err: error, traceId, code: 'INTERNAL_SERVER_ERROR', category: 'INTERNAL' }, 'Unhandled exception');
      set.status = 500;
      return {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Algo salió mal en el servidor',
          category: 'INTERNAL',
          status: 500,
          details: {},
          traceId
        },
        message: 'Algo salió mal en el servidor'
      };
    } catch (middlewareError) {
      console.error('Error inside errorMiddleware:', middlewareError);
      set.status = 500;
      return {
        success: false,
        message: 'Fatal Error',
        error: { message: 'Fatal Error' }
      };
    }
  });
