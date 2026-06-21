import { ApplicationError } from '../../../../shared/domain/error.js';

export class TaskNotFoundError extends ApplicationError {
    constructor() {
        super(404, "Task not found", "NOT_FOUND", "INTERNAL", null, true);
    }
}
