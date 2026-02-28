import { Therapy, Role } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IGetTherapyUseCase } from './therapies.use-cases';
import { ApiError } from '../../shared/apiError';
import { hasRole } from '../../shared/hasRole';

export class GetTherapyUseCase implements IGetTherapyUseCase {
  async execute(therapyId: string, userId: string, role: string): Promise<Therapy> {
    const therapy = await prisma.therapy.findUnique({
      where: { id: therapyId },
      include: {
        psychologist: {
          select: { id: true, name: true, email: true, avatar_url: true }
        },
        consultant: {
          select: { id: true, name: true, email: true, avatar_url: true }
        },
        billing_plan: true,
      },
    });

    if (!therapy) {
      throw ApiError.notFound('Terapia no encontrada', 'THERAPY_NOT_FOUND');
    }

    // Authorization check
    const isAdmin = role === Role.ADMIN || role === Role.ADMIN_PSYCHOLOGIST;
    const isParticipant = therapy.psychologist_id === userId || therapy.consultant_id === userId;

    if (!isAdmin && !isParticipant) {
      throw ApiError.forbidden('No tienes permiso para ver esta terapia', 'INSUFFICIENT_PERMISSIONS');
    }

    // Severity 2 Fix: Strip notes for consultants (spec)
    if (role === Role.CONSULTANT && therapy.consultant_id === userId) {
      (therapy as any).notes = undefined;
    }

    return therapy;
  }
}
