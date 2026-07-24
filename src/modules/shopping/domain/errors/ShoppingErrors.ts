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

export class ActiveListAlreadyExistsError extends ApplicationError {
    constructor() {
        super(409, 'The household already has an active shopping list', 'CONFLICT_ERROR', 'CONFLICT');
    }
}

export class PurchaseNotReadyError extends ApplicationError {
    constructor() {
        super(409, 'All shopping items must be completed before finalizing the purchase', 'PURCHASE_NOT_READY', 'BUSINESS');
    }
}
