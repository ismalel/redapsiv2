import { TherapyNote } from '@prisma/client';

export interface CreateTherapyNoteInput {
  title: string;
  content: string;
}

export interface UpdateTherapyNoteInput {
  title?: string;
  content?: string;
}

export interface IListTherapyNotesUseCase {
  execute(therapyId: string, psychologistId: string): Promise<TherapyNote[]>;
}

export interface ICreateTherapyNoteUseCase {
  execute(therapyId: string, psychologistId: string, input: CreateTherapyNoteInput): Promise<TherapyNote>;
}

export interface IUpdateTherapyNoteUseCase {
  execute(noteId: string, psychologistId: string, input: UpdateTherapyNoteInput): Promise<TherapyNote>;
}

export interface IDeleteTherapyNoteUseCase {
  execute(noteId: string, psychologistId: string): Promise<void>;
}
