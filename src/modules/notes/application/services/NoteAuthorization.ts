import { GetHouseholdUseCase } from '../../../household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership, isHouseholdAdmin } from '../../../household/application/services/HouseholdMembership.js';
import { NoteRepository } from '../../domain/repositories/note.repository.js';
import { NoteEntity } from '../../domain/entities/note.entity.js';
import { NoteNotFoundError, NoteForbiddenError } from '../../domain/errors/note.errors.js';

/**
 * Loads a note the caller may edit or delete: the caller must belong to the
 * note's household and be its author or a household admin.
 */
export async function getEditableNote(
  noteRepository: NoteRepository,
  getHouseholdUseCase: GetHouseholdUseCase,
  noteId: string,
  householdId: string,
  userId: string,
): Promise<NoteEntity> {
  const note = await noteRepository.findById(noteId);
  // A note from another household is reported as missing so its existence is not revealed
  if (!note || note.household_id !== householdId) {
    throw new NoteNotFoundError();
  }

  const household = await assertHouseholdMembership(getHouseholdUseCase, note.household_id, userId);
  if (note.author_id !== userId && !isHouseholdAdmin(household, userId)) {
    throw new NoteForbiddenError();
  }

  return note;
}
