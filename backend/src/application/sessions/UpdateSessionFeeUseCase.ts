import { TherapySession } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IUpdateSessionFeeUseCase } from './sessions.use-cases';
import { ApiError } from '../../shared/apiError';

export class UpdateSessionFeeUseCase implements IUpdateSessionFeeUseCase {
  async execute(sessionId: string, psychologistId: string, fee: number): Promise<TherapySession> {
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

    const updatedSession = await prisma.therapySession.update({
      where: { id: sessionId },
      data: { session_fee: fee },
    });

    return updatedSession;
  }
}
