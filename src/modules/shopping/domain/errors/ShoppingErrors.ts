import { ApplicationError } from '../../../../shared/domain/error.js';

export class ListNotFoundError extends ApplicationError {
    constructor() {
        super(404, "Shopping list not found", "NOT_FOUND_ERROR", "NOT_FOUND");
    }
}

export class ItemNotFoundError extends ApplicationError {
    constructor() {
        super(404, "Shopping item not found in the list", "NOT_FOUND_ERROR", "NOT_FOUND");
    }
}
