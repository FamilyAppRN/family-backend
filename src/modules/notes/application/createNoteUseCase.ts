import { UseCase } from '../../../shared/application/useCase.js';
import { NoteEntity } from '../domain/entities/note.entity.js';
import { NoteRepository } from '../domain/repositories/note.repository.js';
import { createNoteRequestSchema, noteResponseSchema } from './schemas/notes.schemas.js';
import { Type, Static } from '@sinclair/typebox';

const InputSchema = Type.Intersect([
  createNoteRequestSchema as any,
  Type.Object({
    householdId: Type.String(),
    userId: Type.String(),
  }),
]);

export type CreateNoteInput = Static<typeof InputSchema>;

export class CreateNoteUseCase extends UseCase<any, any> {
  protected inputSchema = InputSchema as any;
  protected outputSchema = noteResponseSchema as any;

  constructor(private readonly noteRepository: NoteRepository) {
    super();
  }

  protected async implementation(data: any): Promise<any> {
    return this.noteRepository.create({
      household_id: data.householdId,
      author_id: data.userId,
      title: data.title,
      content: data.content,
      color: data.color || '#FFFFFF',
      pinned: data.pinned ?? false,
    });
  }
}
