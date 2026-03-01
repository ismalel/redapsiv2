import { prisma } from '../../infrastructure/database/prismaClient';
import { IDeleteTherapyNoteUseCase } from './therapy-notes.use-cases';
import { ApiError } from '../../shared/apiError';

export class DeleteTherapyNoteUseCase implements IDeleteTherapyNoteUseCase {
  async execute(noteId: string, psychologistId: string): Promise<void> {
    const note = await prisma.therapyNote.findUnique({
      where: { id: noteId },
    });

    if (!note || note.author_id !== psychologistId) {
      throw ApiError.notFound('Nota no encontrada o sin permisos', 'NOTE_NOT_FOUND');
    }

    await prisma.therapyNote.delete({
      where: { id: noteId },
    });
  }
}
