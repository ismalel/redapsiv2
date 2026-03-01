import { TherapyNote } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ICreateTherapyNoteUseCase, CreateTherapyNoteInput } from './therapy-notes.use-cases';
import { ApiError } from '../../shared/apiError';

export class CreateTherapyNoteUseCase implements ICreateTherapyNoteUseCase {
  async execute(therapyId: string, psychologistId: string, input: CreateTherapyNoteInput): Promise<TherapyNote> {
    const therapy = await prisma.therapy.findUnique({
      where: { id: therapyId },
    });

    if (!therapy || therapy.psychologist_id !== psychologistId) {
      throw ApiError.notFound('Terapia no encontrada', 'THERAPY_NOT_FOUND');
    }

    return prisma.therapyNote.create({
      data: {
        therapy_id: therapyId,
        author_id: psychologistId,
        title: input.title,
        content: input.content,
      },
    });
  }
}
