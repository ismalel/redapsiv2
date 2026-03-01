import { SessionRequestStatus, SessionStatus, NotificationType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export class RespondSessionRequestUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(psychologistId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.sessionRequest.findUnique({
        where: { id: requestId },
        include: { 
          therapy: { include: { billing_plan: true } }
        },
      });

      if (!request || request.therapy.psychologist_id !== psychologistId) {
        throw ApiError.notFound('Solicitud de sesión no encontrada', 'SESSION_REQUEST_NOT_FOUND');
      }

      if (request.status !== SessionRequestStatus.PENDING) {
        throw ApiError.badRequest('Esta solicitud ya ha sido procesada', 'REQUEST_ALREADY_PROCESSED');
      }

      // 1. Update request status
      const updatedRequest = await tx.sessionRequest.update({
        where: { id: requestId },
        data: { status: status as SessionRequestStatus },
      });

      if (status === 'ACCEPTED') {
        // 2. Create session
        await tx.therapySession.create({
          data: {
            therapy_id: request.therapy_id,
            scheduled_at: request.proposed_at,
            duration: 60, // Default duration
            status: SessionStatus.SCHEDULED,
            type: request.type,
            session_fee: request.therapy.billing_plan?.default_fee,
          },
        });

        // 3. Notify consultant
        await this.notificationService.createNotification(
          request.consultant_id,
          NotificationType.SESSION_REQUEST_ACCEPTED,
          { therapy_id: request.therapy_id, scheduled_at: request.proposed_at },
          tx
        );
      } else {
        await this.notificationService.createNotification(
          request.consultant_id,
          NotificationType.SESSION_REQUEST_REJECTED,
          { therapy_id: request.therapy_id },
          tx
        );
      }

      return updatedRequest;
    });
  }
}
