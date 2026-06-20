import { UseCase } from '../../../shared/application/useCase.js';
import { NoteRepository } from '../domain/repositories/note.repository.js';
import { NoteNotFoundError, NoteForbiddenError } from '../domain/errors/note.errors.js';
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

  constructor(private readonly noteRepository: NoteRepository) {
    super();
  }

  protected async implementation(data: any): Promise<any> {
    const note = await this.noteRepository.findById(data.noteId);

    if (!note) {
      throw new NoteNotFoundError();
    }

    // Validando que el usuario pertenezca al hogar o sea el autor (simplified by checking household_id as per routing assumptions, or author_id).
    if (note.household_id !== data.householdId && note.author_id !== data.userId) {
      throw new NoteForbiddenError();
    }

    await this.noteRepository.delete(data.noteId);
    return { success: true };
  }
}
