import { TherapySession, SessionStatus } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IConfirmPostponeUseCase } from './sessions.use-cases';
import { ApiError } from '../../shared/apiError';

export class ConfirmPostponeUseCase implements IConfirmPostponeUseCase {
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

    if (session.status !== SessionStatus.POSTPONED || !session.postponed_to) {
      throw ApiError.unprocessableEntity(
        'Solo se pueden confirmar sesiones en estado POSPONED con una nueva fecha',
        'INVALID_SESSION_STATUS'
      );
    }

    const updatedSession = await prisma.therapySession.update({
      where: { id: sessionId },
      data: { 
        status: SessionStatus.SCHEDULED,
        scheduled_at: session.postponed_to,
        postponed_to: null,
      },
    });

    return updatedSession;
  }
}
