import { ApplicationError } from '../../../../shared/domain/error.js';

export class CalendarEventNotFoundError extends ApplicationError {
  constructor() {
    super(404, 'Evento no encontrado', 'CALENDAR_EVENT_NOT_FOUND', 'NOT_FOUND');
  }
}

export class CalendarEventForbiddenError extends ApplicationError {
  constructor() {
    super(403, 'Solo quien creó el evento o un admin puede cambiarlo', 'CALENDAR_EVENT_FORBIDDEN', 'AUTHORIZATION');
  }
}

export class InvalidCalendarRangeError extends ApplicationError {
  constructor(message = 'El rango de fechas no es válido') {
    super(400, message, 'CALENDAR_INVALID_RANGE', 'VALIDATION');
  }
}
