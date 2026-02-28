import { Therapy, Role } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IListTherapiesUseCase } from './therapies.use-cases';

export class ListTherapiesUseCase implements IListTherapiesUseCase {
  async execute(
    userId: string, 
    role: string, 
    page: number, 
    perPage: number
  ): Promise<{ data: Therapy[]; total: number }> {
    const skip = (page - 1) * perPage;
    
    let where: any = {};
    
    if (role === Role.ADMIN) {
      // Admins see all non-deleted therapies
      where = {};
    } else if (role === Role.PSYCHOLOGIST || role === Role.ADMIN_PSYCHOLOGIST) {
      // Psychologists see their own
      where = { psychologist_id: userId };
    } else if (role === Role.CONSULTANT) {
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

    // Severity 2 Fix: Strip notes for consultants
    if (role === Role.CONSULTANT) {
      therapies.forEach(t => {
        (t as any).notes = undefined;
      });
    }

    return { data: therapies, total };
  }
}
