import { NotesService } from './notes.service.js';

export const NotesController = {
  async getNotes({ params: { householdId } }: any) {
    return await NotesService.getNotes(householdId);
  },

  async createNote({ params: { householdId }, user, body }: any) {
    return await NotesService.createNote(householdId, user.id, body);
  },

  async updateNote({ params: { householdId, noteId }, user, body }: any) {
    return await NotesService.updateNote(householdId, noteId, user.id, body);
  },

  async deleteNote({ params: { householdId, noteId }, user }: any) {
    return await NotesService.deleteNote(householdId, noteId, user.id);
  }
};
