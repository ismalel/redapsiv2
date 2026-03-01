import { SessionNote } from '@prisma/client';

export interface CreateNoteInput {
  content: string;
  is_private: boolean;
}

export interface UpdateNoteInput {
  content?: string;
  is_private?: boolean;
}

export interface IListNotesUseCase {
  execute(sessionId: string, userId: string, role: string): Promise<SessionNote[]>;
}

export interface ICreateNoteUseCase {
  execute(sessionId: string, authorId: string, role: string, input: CreateNoteInput): Promise<SessionNote>;
}

export interface IUpdateNoteUseCase {
  execute(noteId: string, authorId: string, input: UpdateNoteInput): Promise<SessionNote>;
}

export interface IDeleteNoteUseCase {
  execute(noteId: string, authorId: string): Promise<void>;
}
