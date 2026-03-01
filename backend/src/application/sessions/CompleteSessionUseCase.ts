import { TherapySession, SessionStatus, NotificationType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ICompleteSessionUseCase } from './sessions.use-cases';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export class CompleteSessionUseCase implements ICompleteSessionUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(sessionId: string, psychologistId: string): Promise<TherapySession> {
    const session = await prisma.therapySession.findUnique({
      where: { id: sessionId },
      include: { therapy: true }
    });

    if (!session) {
      throw ApiError.notFound('Sesión no encontrada', 'SESSION_NOT_FOUND');
    }

    if (session.therapy.psychologist_id !== psychologistId) {
      throw ApiError.forbidden('No eres la psicóloga de esta sesión', 'FORBIDDEN_SESSION_ACTION');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw ApiError.unprocessableEntity(
        `No se puede completar una sesión con estado ${session.status}`,
        'INVALID_SESSION_STATUS'
      );
    }

    const updatedSession = await prisma.therapySession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.COMPLETED },
    });

    // Notify both
    await Promise.all([
      this.notificationService.createNotification(
        session.therapy.psychologist_id,
        NotificationType.SESSION_COMPLETED,
        { session_id: session.id, therapy_id: session.therapy_id }
      ),
      this.notificationService.createNotification(
        session.therapy.consultant_id,
        NotificationType.SESSION_COMPLETED,
        { session_id: session.id, therapy_id: session.therapy_id }
      )
    ]);

    return updatedSession;
  }
}
