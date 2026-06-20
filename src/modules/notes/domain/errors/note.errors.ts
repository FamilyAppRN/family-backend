import { ApplicationError } from '../../../../shared/domain/error.js';

export class NoteNotFoundError extends ApplicationError {
  constructor() {
    super(404, 'Nota no encontrada', 'NOTE_NOT_FOUND', 'NOT_FOUND');
  }
}

export class NoteForbiddenError extends ApplicationError {
  constructor() {
    super(403, 'No tienes permiso para acceder a esta nota', 'NOTE_FORBIDDEN', 'AUTHORIZATION');
  }
}
