import { SessionRequest } from '@prisma/client';
import { prisma as prismaInstance } from '../../infrastructure/database/prismaClient';

export class ListSessionRequestsUseCase {
  async execute(therapyId: string): Promise<SessionRequest[]> {
    return await prismaInstance.sessionRequest.findMany({
      where: { therapy_id: therapyId },
      orderBy: { created_at: 'desc' },
    });
  }
}
