import { TherapySession, SessionStatus, Role } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { IListSessionsUseCase, ListSessionsInput } from './sessions.use-cases';

export class ListSessionsUseCase implements IListSessionsUseCase {
  async execute(userId: string, role: string, input: ListSessionsInput): Promise<{ data: TherapySession[]; total: number }> {
    const { therapy_id, status, page = 1, per_page = 10 } = input;
    const skip = (page - 1) * per_page;

    const where: any = {};

    if (therapy_id) {
      where.therapy_id = therapy_id;
    }

    if (status) {
      where.status = status;
    }

    // Role-based filtering
    if (role === Role.PSYCHOLOGIST) {
      where.therapy = { psychologist_id: userId };
    } else if (role === Role.CONSULTANT) {
      where.therapy = { consultant_id: userId };
    } else if (role !== Role.ADMIN && role !== Role.ADMIN_PSYCHOLOGIST) {
       // Should be handled by RBAC, but defensive check
       return { data: [], total: 0 };
    }

    const [sessions, total] = await Promise.all([
      prisma.therapySession.findMany({
        where,
        skip,
        take: per_page,
        orderBy: { scheduled_at: 'desc' },
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
          }
        }
      }),
      prisma.therapySession.count({ where })
    ]);

    // Compute effective_fee for each session
    const data = sessions.map((session: any) => {
      const effective_fee = Number(session.session_fee ?? session.therapy.billing_plan.default_fee);
      return { ...session, effective_fee };
    });

    return { data, total };
  }
}
