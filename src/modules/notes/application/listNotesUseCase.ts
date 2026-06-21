import { UseCase } from '../../../shared/application/useCase.js';
import { NoteEntity } from '../domain/entities/note.entity.js';
import { NoteRepository } from '../domain/repositories/note.repository.js';
import { listNotesResponseSchema } from './schemas/notes.schemas.js';
import { Type, Static } from '@sinclair/typebox';

const InputSchema = Type.Object({
  householdId: Type.String(),
});

export type ListNotesInput = Static<typeof InputSchema>;

export class ListNotesUseCase extends UseCase<any, any> {
  protected inputSchema = InputSchema as any;
  protected outputSchema = listNotesResponseSchema as any;

  constructor(private readonly noteRepository: NoteRepository) {
    super();
  }

  protected async implementation(data: any): Promise<any> {
    return this.noteRepository.findByHouseholdId(data.householdId);
  }
}
