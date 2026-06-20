import { NoteRepository } from '../../domain/repositories/note.repository.js';
import { NoteEntity } from '../../domain/entities/note.entity.js';
import { Note, INote } from '../../../../models/Note.js';

export class MongooseNoteRepository implements NoteRepository {
  private mapToEntity(doc: INote): NoteEntity {
    return {
      id: doc._id.toString(),
      household_id: doc.household_id.toString(),
      author_id: doc.author_id.toString(),
      title: doc.title,
      content: doc.content,
      color: doc.color || '#FFFFFF',
      pinned: doc.pinned,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  }

  async create(data: Omit<NoteEntity, 'id' | 'created_at' | 'updated_at'>): Promise<NoteEntity> {
    const note = new Note({
      household_id: data.household_id,
      author_id: data.author_id,
      title: data.title,
      content: data.content,
      color: data.color,
      pinned: data.pinned,
    });

    const savedNote = await note.save();
    return this.mapToEntity(savedNote as INote);
  }

  async findByHouseholdId(householdId: string): Promise<NoteEntity[]> {
    const notes = await Note.find({ household_id: householdId })
      .lean<INote[]>()
      .sort({ pinned: -1, updated_at: -1 })
      .exec();

    return notes.map(doc => this.mapToEntity({ ...doc, _id: doc._id } as INote));
  }

  async findById(id: string): Promise<NoteEntity | null> {
    const note = await Note.findById(id).lean<INote>().exec();
    if (!note) return null;
    return this.mapToEntity({ ...note, _id: note._id } as INote);
  }

  async update(id: string, data: Partial<NoteEntity>): Promise<NoteEntity | null> {
    const note = await Note.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).exec();

    if (!note) return null;
    return this.mapToEntity(note as INote);
  }

  async delete(id: string): Promise<void> {
    await Note.findByIdAndDelete(id).exec();
  }
}
