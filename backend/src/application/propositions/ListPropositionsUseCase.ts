import { ScheduleProposition } from '@prisma/client';
import { prisma as prismaInstance } from '../../infrastructure/database/prismaClient';

export class ListPropositionsUseCase {
  async execute(therapyId: string): Promise<ScheduleProposition[]> {
    return await prismaInstance.scheduleProposition.findMany({
      where: { therapy_id: therapyId },
      orderBy: { created_at: 'desc' },
    });
  }
}
