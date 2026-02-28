import { Therapy } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IUpdateTherapyUseCase, UpdateTherapyInput } from './therapies.use-cases';
import { ApiError } from '../../shared/apiError';

export class UpdateTherapyUseCase implements IUpdateTherapyUseCase {
  async execute(therapyId: string, psychologistId: string, input: UpdateTherapyInput): Promise<Therapy> {
    const therapy = await prisma.therapy.findUnique({
      where: { id: therapyId },
    });

    if (!therapy || therapy.psychologist_id !== psychologistId) {
      throw ApiError.notFound('Terapia no encontrada', 'THERAPY_NOT_FOUND');
    }

    return await prisma.therapy.update({
      where: { id: therapyId },
      data: {
        modality: input.modality,
        notes: input.notes,
        status: input.status,
      },
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
  }
}
