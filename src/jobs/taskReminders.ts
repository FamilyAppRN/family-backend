import cron from 'node-cron';
import { Task } from '../models/Task.js';
import { Household } from '../models/Household.js';
import { pushService } from '../shared/push/PushService.js';
import { reminderRecipients } from '../shared/push/recipients.js';
import logger from '../shared/infrastructure/logger.js';
import { candidateWindow, shouldRemind } from './reminderSchedule.js';

const DEFAULT_TIMEZONE = 'America/Caracas';

/**
 * Una pasada: busca tareas abiertas que tocan ahora y todavía no se
 * recordaron, avisa y marca reminder_sent_at para no repetir.
 */
export async function runTaskReminders(now = new Date()): Promise<number> {
  const { from, to } = candidateWindow(now);
  const tasks = await Task.find({
    status: { $in: ['pending', 'in_progress'] },
    due_date: { $gte: from, $lte: to },
    reminder_sent_at: null,
  }).lean();
  if (tasks.length === 0) return 0;

  const householdIds = [...new Set(tasks.map((task) => task.household_id.toString()))];
  const households = await Household.find({ _id: { $in: householdIds } }, { members: 1, settings: 1 }).lean();
  const byId = new Map(households.map((h) => [h._id.toString(), h]));

  let sent = 0;
  for (const task of tasks) {
    const household = byId.get(task.household_id.toString());
    if (!household || !task.due_date) continue;
    const timeZone = household.settings?.timezone || DEFAULT_TIMEZONE;
    if (!shouldRemind(new Date(task.due_date), timeZone, now)) continue;

    // Se marca antes de enviar: si dos pasadas se cruzan, solo una gana.
    const claimed = await Task.updateOne(
      { _id: task._id, reminder_sent_at: null },
      { $set: { reminder_sent_at: now } },
    );
    if (claimed.modifiedCount === 0) continue;

    const memberIds = household.members.map((member) => member.user_id.toString());
    await pushService.sendToUsers(reminderRecipients(task.assignee_id?.toString(), memberIds), {
      title: 'Recordatorio',
      body: `La tarea "${task.title}" vence pronto.`,
      data: { type: 'task_reminder', householdId: task.household_id.toString(), taskId: task._id.toString() },
    });
    sent += 1;
  }
  return sent;
}

/** Cada 5 minutos, mientras el servidor esté despierto. */
export function startTaskReminderCron(): void {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const sent = await runTaskReminders();
      if (sent > 0) logger.info({ sent }, 'Recordatorios de tareas enviados');
    } catch (error) {
      logger.error({ err: error }, 'Falló la pasada de recordatorios de tareas');
    }
  });
}
