import bcrypt from 'bcrypt';
import { Therapy, Role, TherapyOrigin, TherapyStatus, NotificationType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ICreateTherapyUseCase, CreateTherapyInput } from './therapies.use-cases';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export class CreateTherapyUseCase implements ICreateTherapyUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(psychologistId: string, input: CreateTherapyInput): Promise<Therapy> {
    // 1. Check if consultant already exists, or create new one
    return await prisma.$transaction(async (tx) => {
      let consultantUser = await tx.user.findUnique({
        where: { email: input.consultant_email },
      });

      if (consultantUser) {
        if (consultantUser.role !== Role.CONSULTANT) {
          throw ApiError.conflict('El email pertenece a un usuario que no es consultante', 'INVALID_CONSULTANT_EMAIL');
        }

        // Check if consultant already has an ACTIVE therapy
        const activeTherapy = await tx.therapy.findFirst({
          where: {
            consultant_id: consultantUser.id,
            status: TherapyStatus.ACTIVE,
          },
        });

        if (activeTherapy) {
          throw ApiError.conflict('La consultante ya tiene una terapia activa', 'CONSULTANT_HAS_ACTIVE_THERAPY');
        }
      } else {
        // Create new consultant user with temp password
        const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        consultantUser = await tx.user.create({
          data: {
            email: input.consultant_email,
            name: input.consultant_name,
            password_hash: passwordHash,
            role: Role.CONSULTANT,
            must_change_password: true,
            consultant_profile: {
              create: {},
            },
          },
        });

        // In a real app we would send an email here. 
        // For v1, we log to console as per spec.
        console.log(`[Flow A] Created new consultant: ${input.consultant_email}`);
        console.log(`[Flow A] Temporary password: ${tempPassword}`);
      }

      // 2. Create the therapy
      const therapy = await tx.therapy.create({
        data: {
          psychologist_id: psychologistId,
          consultant_id: consultantUser.id,
          origin: TherapyOrigin.PSYCHOLOGIST_INITIATED,
          modality: input.modality,
          notes: input.notes,
          status: TherapyStatus.PENDING, // Becomes ACTIVE after onboarding (spec)
          billing_plan: {
            create: {
              billing_type: input.billing_plan.billing_type,
              default_fee: input.billing_plan.default_fee,
              recurrence: input.billing_plan.recurrence,
            },
          },
        },
        include: {
          billing_plan: true,
        },
      });

      return therapy;
    });
  }
}
