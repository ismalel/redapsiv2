import { SessionNote, Role, NotificationType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ICreateNoteUseCase, CreateNoteInput } from './session-notes.use-cases';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export class CreateNoteUseCase implements ICreateNoteUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(sessionId: string, authorId: string, role: string, input: CreateNoteInput): Promise<SessionNote> {
    const session = await prisma.therapySession.findUnique({
      where: { id: sessionId },
      include: { therapy: true }
    });

    if (!session) {
      throw ApiError.notFound('Sesión no encontrada', 'SESSION_NOT_FOUND');
    }

    // Role-based authorization
    if (role === Role.PSYCHOLOGIST && session.therapy.psychologist_id !== authorId) {
      throw ApiError.forbidden('No tienes permiso para agregar notas a esta sesión', 'FORBIDDEN_SESSION_ACTION');
    }
    if (role === Role.CONSULTANT && session.therapy.consultant_id !== authorId) {
      throw ApiError.forbidden('No tienes permiso para agregar notas a esta sesión', 'FORBIDDEN_SESSION_ACTION');
    }

    const note = await prisma.sessionNote.create({
      data: {
        session_id: sessionId,
        author_id: authorId,
        content: input.content,
        is_private: input.is_private,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Notify the other party if not private
    if (!input.is_private) {
      const recipientId = role === Role.PSYCHOLOGIST 
        ? session.therapy.consultant_id 
        : session.therapy.psychologist_id;

      await this.notificationService.createNotification(
        recipientId,
        NotificationType.NOTE_ADDED,
        { session_id: sessionId, therapy_id: session.therapy_id, note_id: note.id }
      );
    }

    return note;
  }
}
