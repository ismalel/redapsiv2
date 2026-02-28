import { TherapyRequestStatus, TherapyStatus, TherapyOrigin, BillingType, NotificationType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export class RespondTherapyRequestUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(psychologistId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.therapyRequest.findUnique({
        where: { id: requestId },
        include: {
          psychologist: { select: { name: true } }
        }
      });

      if (!request || request.psychologist_id !== psychologistId) {
        throw ApiError.notFound('Solicitud no encontrada', 'REQUEST_NOT_FOUND');
      }

      if (request.status !== TherapyRequestStatus.PENDING) {
        throw ApiError.badRequest('Esta solicitud ya ha sido procesada', 'REQUEST_ALREADY_PROCESSED');
      }

      // 1. Update request status
      const updatedRequest = await tx.therapyRequest.update({
        where: { id: requestId },
        data: { status: status as TherapyRequestStatus },
      });

      if (status === 'ACCEPTED') {
        // 2. Check if consultant has an active therapy (just in case)
        const activeTherapy = await tx.therapy.findFirst({
          where: { consultant_id: request.consultant_id, status: TherapyStatus.ACTIVE },
        });

        if (activeTherapy) {
          throw ApiError.conflict('La consultante ya tiene una terapia activa', 'CONSULTANT_HAS_ACTIVE_THERAPY');
        }

        // 3. Create Therapy
        const psychologistProfile = await tx.psychologistProfile.findUnique({
          where: { user_id: psychologistId },
        });

        await tx.therapy.create({
          data: {
            psychologist_id: psychologistId,
            consultant_id: request.consultant_id,
            origin: TherapyOrigin.CONSULTANT_INITIATED,
            modality: 'virtual', // default
            status: TherapyStatus.ACTIVE, // Becomes active immediately if accepted Flow B
            billing_plan: {
              create: {
                billing_type: BillingType.PER_SESSION,
                default_fee: psychologistProfile?.session_fee || 500,
              },
            },
          },
        });

        // 4. Notify consultant
        await this.notificationService.createNotification(
          request.consultant_id,
          NotificationType.THERAPY_REQUEST_ACCEPTED,
          { psychologist_name: request.psychologist.name },
          tx
        );
      } else {
        // Notify rejection
        await this.notificationService.createNotification(
          request.consultant_id,
          NotificationType.THERAPY_REQUEST_REJECTED,
          { psychologist_name: request.psychologist.name },
          tx
        );
      }

      return updatedRequest;
    });
  }
}
