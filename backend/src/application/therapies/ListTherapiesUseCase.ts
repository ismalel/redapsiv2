import { Therapy, Role } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IListTherapiesUseCase } from './therapies.use-cases';
import { hasRole } from '../../shared/hasRole';

export class ListTherapiesUseCase implements IListTherapiesUseCase {
  async execute(
    userId: string, 
    role: string, 
    page: number, 
    perPage: number
  ): Promise<{ data: Therapy[]; total: number }> {
    const skip = (page - 1) * perPage;
    
    let where: any = {};
    
    const isAdmin = hasRole({ role } as any, Role.ADMIN);
    const isPsychologist = hasRole({ role } as any, Role.PSYCHOLOGIST);
    const isConsultant = hasRole({ role } as any, Role.CONSULTANT);

    if (isAdmin) {
      // Admins see all
      where = {};
    } else if (isPsychologist) {
      // Psychologists see their own
      where = { psychologist_id: userId };
    } else if (isConsultant) {
      // Consultants see their own
      where = { consultant_id: userId };
    }

    const [therapies, total] = await Promise.all([
      prisma.therapy.findMany({
        where,
        include: {
          psychologist: {
            select: { id: true, name: true, email: true, avatar_url: true }
          },
          consultant: {
            select: { id: true, name: true, email: true, avatar_url: true }
          },
          billing_plan: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.therapy.count({ where }),
    ]);

    // Strip notes for anyone who is not the psychologist of the therapy
    therapies.forEach(t => {
      const isThePsychologist = isPsychologist && t.psychologist_id === userId;
      if (!isThePsychologist) {
        (t as any).notes = undefined;
      }
    });

    return { data: therapies, total };
  }
}
