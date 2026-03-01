import { SessionNote } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IUpdateNoteUseCase, UpdateNoteInput } from './session-notes.use-cases';
import { ApiError } from '../../shared/apiError';

export class UpdateNoteUseCase implements IUpdateNoteUseCase {
  async execute(noteId: string, authorId: string, input: UpdateNoteInput): Promise<SessionNote> {
    const note = await prisma.sessionNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw ApiError.notFound('Nota no encontrada', 'NOTE_NOT_FOUND');
    }

    if (note.author_id !== authorId) {
      throw ApiError.forbidden('No tienes permiso para editar esta nota', 'FORBIDDEN_NOTE_ACTION');
    }

    const updatedNote = await prisma.sessionNote.update({
      where: { id: noteId },
      data: {
        content: input.content,
        is_private: input.is_private,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return updatedNote;
  }
}
