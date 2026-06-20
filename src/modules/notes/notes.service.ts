export class NotesService {
  static async getNotes(householdId: string): Promise<any> {
    return { message: 'Get notes active', householdId, notes: [] };
  }

  static async createNote(householdId: string, userId: string, body: any): Promise<any> {
    return { message: 'Create note active', householdId, authorId: userId, data: body };
  }

  static async updateNote(householdId: string, noteId: string, userId: string, body: any): Promise<any> {
    return { message: 'Update note active', householdId, noteId, authorId: userId, data: body };
  }

  static async deleteNote(householdId: string, noteId: string, userId: string): Promise<any> {
    return { message: 'Delete note active', householdId, noteId, deletedBy: userId };
  }
}
