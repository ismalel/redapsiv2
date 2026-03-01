import { prisma } from '../../infrastructure/database/prismaClient';
import { IDeleteNoteUseCase } from './session-notes.use-cases';
import { ApiError } from '../../shared/apiError';

export class DeleteNoteUseCase implements IDeleteNoteUseCase {
  async execute(noteId: string, authorId: string): Promise<void> {
    const note = await prisma.sessionNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw ApiError.notFound('Nota no encontrada', 'NOTE_NOT_FOUND');
    }

    if (note.author_id !== authorId) {
      throw ApiError.forbidden('No tienes permiso para eliminar esta nota', 'FORBIDDEN_NOTE_ACTION');
    }

    await prisma.sessionNote.delete({
      where: { id: noteId },
    });
  }
}
