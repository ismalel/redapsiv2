import { SessionNote, Role } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IListNotesUseCase } from './session-notes.use-cases';
import { ApiError } from '../../shared/apiError';

export class ListNotesUseCase implements IListNotesUseCase {
  async execute(sessionId: string, userId: string, role: string): Promise<SessionNote[]> {
    // 1. Verify access to the session
    const session = await prisma.therapySession.findUnique({
      where: { id: sessionId },
      include: { therapy: true }
    });

    if (!session) {
      throw ApiError.notFound('Sesión no encontrada', 'SESSION_NOT_FOUND');
    }

    if (role === Role.PSYCHOLOGIST && session.therapy.psychologist_id !== userId) {
      throw ApiError.forbidden('No tienes permiso para ver las notas de esta sesión', 'FORBIDDEN_SESSION_ACCESS');
    }
    if (role === Role.CONSULTANT && session.therapy.consultant_id !== userId) {
      throw ApiError.forbidden('No tienes permiso para ver las notas de esta sesión', 'FORBIDDEN_SESSION_ACCESS');
    }

    // 2. Filter notes by privacy logic
    const notes = await prisma.sessionNote.findMany({
      where: {
        session_id: sessionId,
        OR: [
          { is_private: false },
          { author_id: userId }
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    return notes;
  }
}
