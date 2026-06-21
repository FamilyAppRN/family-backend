import { UseCase } from '../../../shared/application/useCase.js';
import { NoteEntity } from '../domain/entities/note.entity.js';
import { NoteRepository } from '../domain/repositories/note.repository.js';
import { NoteNotFoundError, NoteForbiddenError } from '../domain/errors/note.errors.js';
import { updateNoteRequestSchema, noteResponseSchema } from './schemas/notes.schemas.js';
import { Type, Static } from '@sinclair/typebox';

const InputSchema = Type.Intersect([
  updateNoteRequestSchema as any,
  Type.Object({
    noteId: Type.String(),
    householdId: Type.String(),
    userId: Type.String(),
  }),
]);

export type UpdateNoteInput = Static<typeof InputSchema>;

export class UpdateNoteUseCase extends UseCase<any, any> {
  protected inputSchema = InputSchema as any;
  protected outputSchema = noteResponseSchema as any;

  constructor(private readonly noteRepository: NoteRepository) {
    super();
  }

  protected async implementation(data: any): Promise<any> {
    const note = await this.noteRepository.findById(data.noteId);

    if (!note) {
      throw new NoteNotFoundError();
    }

    if (note.household_id !== data.householdId) {
      throw new NoteForbiddenError();
    }

    const updateData: Partial<NoteEntity> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.pinned !== undefined) updateData.pinned = data.pinned;

    const updatedNote = await this.noteRepository.update(data.noteId, updateData);

    if (!updatedNote) {
      throw new NoteNotFoundError();
    }

    return updatedNote;
  }
}
