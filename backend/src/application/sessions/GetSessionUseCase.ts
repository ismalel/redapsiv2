import { TherapySession, Role } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IGetSessionUseCase } from './sessions.use-cases';
import { ApiError } from '../../shared/apiError';

export class GetSessionUseCase implements IGetSessionUseCase {
  async execute(sessionId: string, userId: string, role: string): Promise<any> {
    const session = await prisma.therapySession.findUnique({
      where: { id: sessionId },
      include: {
        therapy: {
          include: {
            billing_plan: true,
            psychologist: {
                select: { id: true, name: true, email: true }
            },
            consultant: {
                select: { id: true, name: true, email: true }
            }
          }
        },
        notes: {
          where: {
            OR: [
              { is_private: false },
              { author_id: userId }
            ]
          },
          include: {
            author: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!session) {
      throw ApiError.notFound('Sesión no encontrada', 'SESSION_NOT_FOUND');
    }

    // Role-based authorization
    if (role === Role.PSYCHOLOGIST && session.therapy.psychologist_id !== userId) {
      throw ApiError.forbidden('No tienes permiso para ver esta sesión', 'FORBIDDEN_SESSION_ACCESS');
    }
    if (role === Role.CONSULTANT && session.therapy.consultant_id !== userId) {
      throw ApiError.forbidden('No tienes permiso para ver esta sesión', 'FORBIDDEN_SESSION_ACCESS');
    }

    // Compute effective_fee
    const defaultFee = session.therapy.billing_plan?.default_fee ? Number(session.therapy.billing_plan.default_fee) : 0;
    const effective_fee = session.session_fee ? Number(session.session_fee) : defaultFee;

    return { ...session, effective_fee };
  }
}
