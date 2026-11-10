/**
 * A quién avisar, según reglas-para-push.md. Funciones puras: sin base de
 * datos, para poder probarlas solas.
 */

/** Todos los miembros menos quien hizo la acción (urgente, voy al súper, nuevo miembro). */
export function otherMembers(memberIds: string[], actorId: string): string[] {
  return [...new Set(memberIds)].filter((id) => id !== actorId);
}

/**
 * Solo la persona asignada, y solo si la asignación es nueva y no se la
 * asignó ella misma.
 */
export function newAssigneeRecipient(
  assigneeId: string | null | undefined,
  actorId: string,
  previousAssigneeId?: string | null,
): string[] {
  if (!assigneeId || assigneeId === actorId || assigneeId === previousAssigneeId) return [];
  return [assigneeId];
}

/** Recordatorio: a quien tiene la tarea; si nadie la tiene, a todo el hogar. */
export function reminderRecipients(assigneeId: string | null | undefined, memberIds: string[]): string[] {
  return assigneeId ? [assigneeId] : [...new Set(memberIds)];
}
