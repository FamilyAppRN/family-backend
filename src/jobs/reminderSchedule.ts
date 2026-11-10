/**
 * Cuándo recordar una tarea. Función pura, para probarla sin base de datos.
 *
 * - Con hora: 1 hora antes del vencimiento, hasta que vence.
 * - Sin hora (la app la guarda a las 00:00 locales del hogar): a las 8:00 de
 *   ese día, durante ese día. Así no llega a las 23:00 de la noche anterior.
 */

const HOUR_MS = 60 * 60 * 1000;
export const DATE_ONLY_REMINDER_HOUR = 8;
export const TIMED_REMINDER_LEAD_MS = HOUR_MS;

/** Hora y minuto de `date` en la zona horaria del hogar. */
function localTime(date: Date, timeZone: string): { hour: number; minute: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? NaN);
    return { hour: read('hour'), minute: read('minute') };
  } catch {
    // Zona inválida: se usa UTC antes que no recordar.
    return { hour: date.getUTCHours(), minute: date.getUTCMinutes() };
  }
}

export function isDateOnly(due: Date, timeZone: string): boolean {
  const { hour, minute } = localTime(due, timeZone);
  return hour === 0 && minute === 0;
}

/** true si a esta hora corresponde mandar el recordatorio de esa fecha límite. */
export function shouldRemind(due: Date, timeZone: string, now: Date): boolean {
  const dueMs = due.getTime();
  const nowMs = now.getTime();
  if (isDateOnly(due, timeZone)) {
    const remindAt = dueMs + DATE_ONLY_REMINDER_HOUR * HOUR_MS;
    return nowMs >= remindAt && nowMs < dueMs + 24 * HOUR_MS;
  }
  return nowMs >= dueMs - TIMED_REMINDER_LEAD_MS && nowMs < dueMs;
}

/** Rango de fechas límite que pueden tocar ahora (para la consulta a la base). */
export function candidateWindow(now: Date): { from: Date; to: Date } {
  return {
    from: new Date(now.getTime() - 24 * HOUR_MS),
    to: new Date(now.getTime() + TIMED_REMINDER_LEAD_MS),
  };
}
