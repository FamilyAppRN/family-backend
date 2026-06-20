import { TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { ValidationError } from '../domain/error.js';
import logger from '../infrastructure/logger.js';

export abstract class UseCase<TInput, TOutput> {
    protected abstract inputSchema: any;
    protected abstract outputSchema: any;

    // Lógica pura de negocio implementada por la subclase
    protected abstract implementation(data: TInput): Promise<TOutput>;

    // Punto de entrada principal con validación integrada
    public async execute(data: unknown): Promise<TOutput> {
        // 1. Validar la Entrada
        if (!Value.Check(this.inputSchema, data)) {
            const errors = [...Value.Errors(this.inputSchema, data)];
            throw new ValidationError(errors.map((e) => `${e.path}: ${e.message}`));
        }
        
        const validatedIn = Value.Decode(this.inputSchema, data) as TInput;

        // 2. Ejecutar Lógica
        const result = await this.implementation(validatedIn);

        // 3. Validar/Sanitizar la Salida (Elimina campos no declarados)
        try {
            const cleanedOut = Value.Clean(this.outputSchema, result);
            return cleanedOut as TOutput;
        } catch (error) {
            logger.error({ err: error }, 'Output validation error during data sanitization');
            throw new ValidationError(['Internal server error during data sanitization']);
        }
    }
}
