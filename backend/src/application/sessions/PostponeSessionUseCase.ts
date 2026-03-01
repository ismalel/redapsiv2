import { TherapySession, SessionStatus, NotificationType, Role } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IPostponeSessionUseCase } from './sessions.use-cases';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export class PostponeSessionUseCase implements IPostponeSessionUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(sessionId: string, userId: string, role: string, newDate: Date, reason?: string): Promise<TherapySession> {
    const session = await prisma.therapySession.findUnique({
      where: { id: sessionId },
      include: { therapy: true }
    });

    if (!session) {
      throw ApiError.notFound('Sesión no encontrada', 'SESSION_NOT_FOUND');
    }

    // Role-based authorization
    if (role === Role.PSYCHOLOGIST && session.therapy.psychologist_id !== userId) {
      throw ApiError.forbidden('No tienes permiso para posponer esta sesión', 'FORBIDDEN_SESSION_ACTION');
    }
    if (role === Role.CONSULTANT && session.therapy.consultant_id !== userId) {
      throw ApiError.forbidden('No tienes permiso para posponer esta sesión', 'FORBIDDEN_SESSION_ACTION');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw ApiError.unprocessableEntity(
        `No se puede posponer una sesión con estado ${session.status}`,
        'INVALID_SESSION_STATUS'
      );
    }

    const updatedSession = await prisma.therapySession.update({
      where: { id: sessionId },
      data: { 
        status: SessionStatus.POSTPONED,
        postponed_to: newDate,
      },
    });

    // Notify both
    await Promise.all([
      this.notificationService.createNotification(
        session.therapy.psychologist_id,
        NotificationType.SESSION_POSTPONED,
        { session_id: session.id, therapy_id: session.therapy_id, postponed_by: userId, postponed_to: newDate }
      ),
      this.notificationService.createNotification(
        session.therapy.consultant_id,
        NotificationType.SESSION_POSTPONED,
        { session_id: session.id, therapy_id: session.therapy_id, postponed_by: userId, postponed_to: newDate }
      )
    ]);

    return updatedSession;
  }
}
