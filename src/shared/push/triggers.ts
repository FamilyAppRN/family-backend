import { Household } from '../../models/Household.js';
import { pushService } from './PushService.js';
import { newAssigneeRecipient, otherMembers } from './recipients.js';

/**
 * Avisos que disparan las rutas. Se llaman sin esperar (void): el aviso
 * nunca debe demorar ni romper la respuesta. Los textos van en español, el
 * idioma de reglas-para-push.md, hasta que el usuario tenga idioma guardado.
 */

interface Actor {
  id: string;
  name: string;
}

async function memberIdsOf(householdId: string): Promise<string[]> {
  const household = await Household.findById(householdId, { members: 1 }).lean();
  return (household?.members ?? []).map((member) => member.user_id.toString());
}

export async function notifyTaskAssigned(
  task: { id: string; household_id: string; title: string; assignee_id?: string | null },
  actor: Actor,
  previousAssigneeId?: string | null,
): Promise<void> {
  const recipients = newAssigneeRecipient(task.assignee_id, actor.id, previousAssigneeId);
  if (recipients.length === 0) return;
  await pushService.sendToUsers(recipients, {
    title: 'Nueva tarea',
    body: `${actor.name} te asignó: ${task.title}`,
    data: { type: 'task_assigned', householdId: task.household_id, taskId: task.id },
  });
}

export async function notifyUrgentItem(householdId: string, itemName: string, actor: Actor): Promise<void> {
  const recipients = otherMembers(await memberIdsOf(householdId), actor.id);
  await pushService.sendToUsers(recipients, {
    title: 'Compra urgente',
    body: `${actor.name} agregó un ítem urgente: ${itemName}`,
    data: { type: 'urgent_item', householdId },
  });
}

export async function notifyGoingShopping(householdId: string, actor: Actor): Promise<void> {
  const recipients = otherMembers(await memberIdsOf(householdId), actor.id);
  await pushService.sendToUsers(recipients, {
    title: 'Voy al súper',
    body: `${actor.name} va al supermercado. Si necesitas algo, agrégalo a la lista ahora.`,
    data: { type: 'going_shopping', householdId },
  });
}

export async function notifyMemberJoined(householdId: string, memberIds: string[], newMember: Actor): Promise<void> {
  await pushService.sendToUsers(otherMembers(memberIds, newMember.id), {
    title: 'Nuevo miembro',
    body: `${newMember.name} se unió al hogar. Ya pueden compartir listas y tareas.`,
    data: { type: 'member_joined', householdId },
  });
}
