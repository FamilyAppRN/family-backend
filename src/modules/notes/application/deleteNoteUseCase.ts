import { UseCase } from '../../../shared/application/useCase.js';
import { NoteRepository } from '../domain/repositories/note.repository.js';
import { GetHouseholdUseCase } from '../../household/application/useCases/GetHouseholdUseCase.js';
import { getEditableNote } from './services/NoteAuthorization.js';
import { Type, Static } from '@sinclair/typebox';

const InputSchema = Type.Object({
  noteId: Type.String(),
  householdId: Type.String(),
  userId: Type.String(),
});

export type DeleteNoteInput = Static<typeof InputSchema>;

// Returning void or null. Let's return a success message or just null.
export class DeleteNoteUseCase extends UseCase<any, any> {
  protected inputSchema = InputSchema as any;
  protected outputSchema = Type.Object({ success: Type.Boolean() }) as any;

  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly getHouseholdUseCase: GetHouseholdUseCase,
  ) {
    super();
  }

  protected async implementation(data: any): Promise<any> {
    await getEditableNote(this.noteRepository, this.getHouseholdUseCase, data.noteId, data.householdId, data.userId);

    await this.noteRepository.delete(data.noteId);
    return { success: true };
  }
}
