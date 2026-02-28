import { TherapyRequest, Role, prisma } from '@prisma/client';
import { prisma as prismaInstance } from '../../infrastructure/database/prismaClient';
import { hasRole } from '../../shared/hasRole';

export class ListTherapyRequestsUseCase {
  async execute(userId: string, role: string): Promise<TherapyRequest[]> {
    let where: any = {};
    
    const isPsychologist = hasRole({ role } as any, Role.PSYCHOLOGIST);
    const isConsultant = hasRole({ role } as any, Role.CONSULTANT);

    if (isPsychologist) {
      where = { psychologist_id: userId };
    } else if (isConsultant) {
      where = { consultant_id: userId };
    }

    return await prismaInstance.therapyRequest.findMany({
      where,
      include: {
        psychologist: { select: { name: true, avatar_url: true } },
        consultant: { select: { name: true, avatar_url: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
