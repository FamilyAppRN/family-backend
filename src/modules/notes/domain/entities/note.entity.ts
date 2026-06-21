export interface NoteEntity {
  id: string;
  household_id: string;
  author_id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  created_at: Date;
  updated_at: Date;
}
