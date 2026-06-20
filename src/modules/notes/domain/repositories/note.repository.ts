import { NoteEntity } from '../entities/note.entity.js';

export interface NoteRepository {
  create(data: Omit<NoteEntity, 'id' | 'created_at' | 'updated_at'>): Promise<NoteEntity>;
  findByHouseholdId(householdId: string): Promise<NoteEntity[]>;
  findById(id: string): Promise<NoteEntity | null>;
  update(id: string, data: Partial<NoteEntity>): Promise<NoteEntity | null>;
  delete(id: string): Promise<void>;
}
