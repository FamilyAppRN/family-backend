import { GetHouseholdUseCase } from '../../household/application/useCases/GetHouseholdUseCase.js';
import {
  assertHouseholdMembership,
  assertIsMember,
  assertPremiumHousehold,
  isHouseholdAdmin,
} from '../../household/application/services/HouseholdMembership.js';
import type { HouseholdEntity } from '../../household/domain/entities/HouseholdEntity.js';
import type { PlanLookup } from '../../household/domain/services/PlanLookup.js';
import { CalendarEventEntity, CalendarOccurrence } from '../domain/entities/CalendarEventEntity.js';
import { CalendarEventChanges, CalendarEventRepository } from '../domain/repositories/CalendarEventRepository.js';
import {
  CalendarEventForbiddenError,
  CalendarEventNotFoundError,
  InvalidCalendarRangeError,
} from '../domain/errors/CalendarErrors.js';
import { expandOccurrences } from '../domain/occurrences.js';

/** Campos tal como llegan por HTTP (fechas como texto). */
export interface CalendarEventInput {
  title?: string;
  description?: string | null;
  start_at?: string;
  end_at?: string | null;
  all_day?: boolean;
  recurrence?: { freq: 'daily' | 'weekly' | 'monthly'; until?: string | null } | null;
  attendees?: string[];
}

/** Rango máximo de una consulta: unas 6 semanas sobran para la vista de mes. */
const MAX_RANGE_MS = 62 * 24 * 60 * 60 * 1000;

function parseDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new InvalidCalendarRangeError(`Fecha inválida en ${field}`);
  return date;
}

/**
 * Calendario del hogar. Todo exige ser miembro y que el hogar sea Premium.
 * Cualquiera crea eventos; editarlos o borrarlos, quien los creó o un admin.
 */
export class CalendarService {
  constructor(
    private readonly events: CalendarEventRepository,
    private readonly getHousehold: GetHouseholdUseCase,
    private readonly planLookup: PlanLookup,
  ) {}

  private async premiumMember(householdId: string, userId: string): Promise<HouseholdEntity> {
    const household = await assertHouseholdMembership(this.getHousehold, householdId, userId);
    await assertPremiumHousehold(household, this.planLookup);
    return household;
  }

  private toChanges(input: CalendarEventInput, household: HouseholdEntity): CalendarEventChanges {
    const changes: CalendarEventChanges = {};
    if (input.title !== undefined) changes.title = input.title.trim();
    if (input.description !== undefined) changes.description = input.description?.trim() || null;
    if (input.start_at !== undefined) changes.start_at = parseDate(input.start_at, 'start_at');
    if (input.end_at !== undefined) changes.end_at = input.end_at ? parseDate(input.end_at, 'end_at') : null;
    if (input.all_day !== undefined) changes.all_day = input.all_day;
    if (input.recurrence !== undefined) {
      changes.recurrence = input.recurrence
        ? { freq: input.recurrence.freq, until: input.recurrence.until ? parseDate(input.recurrence.until, 'until') : null }
        : null;
    }
    if (input.attendees !== undefined) {
      const attendees = [...new Set(input.attendees)];
      attendees.forEach((id) => assertIsMember(household, id));
      changes.attendees = attendees;
    }
    return changes;
  }

  private assertTimes(start: Date, end: Date | null): void {
    if (end && end.getTime() < start.getTime()) {
      throw new InvalidCalendarRangeError('El evento no puede terminar antes de empezar');
    }
  }

  async list(householdId: string, userId: string, from: string, to: string): Promise<CalendarOccurrence[]> {
    await this.premiumMember(householdId, userId);
    const fromDate = parseDate(from, 'from');
    const toDate = parseDate(to, 'to');
    if (toDate <= fromDate || toDate.getTime() - fromDate.getTime() > MAX_RANGE_MS) {
      throw new InvalidCalendarRangeError();
    }
    const candidates = await this.events.findCandidates(householdId, fromDate, toDate);
    return candidates
      .flatMap((event) => expandOccurrences(event, fromDate, toDate))
      .sort((a, b) => a.occurrence_start.getTime() - b.occurrence_start.getTime());
  }

  async create(householdId: string, userId: string, input: CalendarEventInput): Promise<CalendarEventEntity> {
    const household = await this.premiumMember(householdId, userId);
    const changes = this.toChanges(input, household);
    if (!changes.title || !changes.start_at) throw new InvalidCalendarRangeError('Faltan el título o la fecha');
    this.assertTimes(changes.start_at, changes.end_at ?? null);
    return this.events.create({
      household_id: householdId,
      created_by: userId,
      title: changes.title,
      description: changes.description ?? null,
      start_at: changes.start_at,
      end_at: changes.end_at ?? null,
      all_day: changes.all_day ?? false,
      recurrence: changes.recurrence ?? null,
      attendees: changes.attendees ?? [],
    });
  }

  private async editable(eventId: string, userId: string): Promise<{ event: CalendarEventEntity; household: HouseholdEntity }> {
    const event = await this.events.findById(eventId);
    if (!event) throw new CalendarEventNotFoundError();
    const household = await this.premiumMember(event.household_id, userId);
    if (event.created_by !== userId && !isHouseholdAdmin(household, userId)) throw new CalendarEventForbiddenError();
    return { event, household };
  }

  async update(eventId: string, userId: string, input: CalendarEventInput): Promise<CalendarEventEntity> {
    const { event, household } = await this.editable(eventId, userId);
    const changes = this.toChanges(input, household);
    this.assertTimes(changes.start_at ?? event.start_at, changes.end_at !== undefined ? changes.end_at : event.end_at);
    const updated = await this.events.update(eventId, changes);
    if (!updated) throw new CalendarEventNotFoundError();
    return updated;
  }

  async remove(eventId: string, userId: string): Promise<CalendarEventEntity> {
    const { event } = await this.editable(eventId, userId);
    await this.events.delete(eventId);
    return event;
  }
}
