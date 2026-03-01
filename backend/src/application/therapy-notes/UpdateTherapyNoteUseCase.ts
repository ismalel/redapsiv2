import { TherapyNote } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IUpdateTherapyNoteUseCase, UpdateTherapyNoteInput } from './therapy-notes.use-cases';
import { ApiError } from '../../shared/apiError';

export class UpdateTherapyNoteUseCase implements IUpdateTherapyNoteUseCase {
  async execute(noteId: string, psychologistId: string, input: UpdateTherapyNoteInput): Promise<TherapyNote> {
    const note = await prisma.therapyNote.findUnique({
      where: { id: noteId },
    });

    if (!note || note.author_id !== psychologistId) {
      throw ApiError.notFound('Nota no encontrada o sin permisos', 'NOTE_NOT_FOUND');
    }

    return prisma.therapyNote.update({
      where: { id: noteId },
      data: {
        title: input.title,
        content: input.content,
      },
    });
  }
}
