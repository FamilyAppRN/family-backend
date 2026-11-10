import { UseCase } from '../../../shared/application/useCase.js';
import { NoteEntity } from '../domain/entities/note.entity.js';
import { NoteRepository } from '../domain/repositories/note.repository.js';
import { createNoteRequestSchema, noteResponseSchema } from './schemas/notes.schemas.js';
import { t } from 'elysia';
import { GetHouseholdUseCase } from '../../household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership } from '../../household/application/services/HouseholdMembership.js';

const InputSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 100 }),
  content: t.String({ minLength: 1, maxLength: 2000 }),
  color: t.Optional(t.String()),
  pinned: t.Optional(t.Boolean()),
  householdId: t.String(),
  userId: t.String(),
});

export class CreateNoteUseCase extends UseCase<any, any> {
  protected inputSchema = InputSchema as any;
  protected outputSchema = noteResponseSchema as any;

  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly getHouseholdUseCase: GetHouseholdUseCase,
  ) {
    super();
  }

  protected async implementation(data: any): Promise<any> {
    await assertHouseholdMembership(this.getHouseholdUseCase, data.householdId, data.userId);

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
