export type ErrorCategory =
    | "VALIDATION"
    | "AUTHENTICATION"
    | "AUTHORIZATION"
    | "NOT_FOUND"
    | "CONFLICT"
    | "BUSINESS"
    | "INFRASTRUCTURE"
    | "INTERNAL";

export type ErrorCode =
    | "VALIDATION_ERROR"
    | "INTERNAL_SERVER_ERROR"
    | "NOT_FOUND_ERROR"
    | "AUTH_MISSING_TOKEN"
    | "AUTH_INVALID_TOKEN"
    | string;
