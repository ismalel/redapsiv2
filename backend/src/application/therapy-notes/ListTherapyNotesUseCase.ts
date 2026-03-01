import { TherapyNote } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IListTherapyNotesUseCase } from './therapy-notes.use-cases';
import { ApiError } from '../../shared/apiError';

export class ListTherapyNotesUseCase implements IListTherapyNotesUseCase {
  async execute(therapyId: string, psychologistId: string): Promise<TherapyNote[]> {
    const therapy = await prisma.therapy.findUnique({
      where: { id: therapyId },
    });

    if (!therapy || therapy.psychologist_id !== psychologistId) {
      throw ApiError.notFound('Terapia no encontrada', 'THERAPY_NOT_FOUND');
    }

    return prisma.therapyNote.findMany({
      where: { therapy_id: therapyId },
      orderBy: { created_at: 'desc' },
    });
  }
}
