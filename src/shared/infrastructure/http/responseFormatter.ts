import { randomUUID } from 'crypto';
import { ErrorCode, ErrorCategory } from '../../domain/error-codes.js';

export class ApiResponse {
    static success(data: any, message: string = "Success", statusCode: number = 200) {
        return {
            status: statusCode,
            body: {
                success: true,
                message,
                data
            }
        };
    }

    static error(
        message: string = "Error",
        statusCode: number = 400,
        errors?: any,
        code: ErrorCode = "INTERNAL_SERVER_ERROR",
        category: ErrorCategory = "INTERNAL",
        traceId?: string
    ) {
        const finalTraceId = traceId || randomUUID();

        return {
            status: statusCode,
            body: {
                success: false,
                error: {
                    code,
                    message,
                    category,
                    status: statusCode,
                    details: errors || {},
                    traceId: finalTraceId
                },
                message
            }
        };
    }
}
