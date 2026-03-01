import { PropositionStatus, SessionStatus, NotificationType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export class SelectPropositionSlotUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(consultantId: string, propositionId: string, selectedSlot: Date) {
    return await prisma.$transaction(async (tx) => {
      const proposition = await tx.scheduleProposition.findUnique({
        where: { id: propositionId },
        include: { 
          therapy: { 
            include: { billing_plan: true } 
          } 
        }
      });

      if (!proposition || proposition.therapy.consultant_id !== consultantId) {
        throw ApiError.notFound('Propuesta no encontrada', 'PROPOSITION_NOT_FOUND');
      }

      if (proposition.status !== PropositionStatus.PENDING) {
        throw ApiError.badRequest('Esta propuesta ya no está pendiente', 'PROPOSITION_ALREADY_PROCESSED');
      }

      // Verify selected slot is among the proposed ones
      const isValidSlot = proposition.proposed_slots.some(
        date => date.getTime() === selectedSlot.getTime()
      );

      if (!isValidSlot) {
        throw ApiError.badRequest('El horario seleccionado no es parte de la propuesta original', 'INVALID_SELECTED_SLOT');
      }

      // 1. Update proposition
      const updatedProposition = await tx.scheduleProposition.update({
        where: { id: propositionId },
        data: { 
          selected_slot: selectedSlot,
          status: PropositionStatus.ACCEPTED
        },
      });

      // 2. Create TherapySession
      await tx.therapySession.create({
        data: {
          therapy_id: proposition.therapy_id,
          proposition_id: proposition.id,
          scheduled_at: selectedSlot,
          duration: 60, // Default duration as per schema requirement or business rule
          status: SessionStatus.SCHEDULED,
          type: proposition.type,
          session_fee: proposition.therapy.billing_plan?.default_fee,
        },
      });

      // 3. Notify psychologist
      await this.notificationService.createNotification(
        proposition.therapy.psychologist_id,
        NotificationType.PROPOSITION_ACCEPTED,
        { therapy_id: proposition.therapy_id, selected_slot: selectedSlot },
        tx
      );

      // 4. Notify consultant (confirmation)
      await this.notificationService.createNotification(
        consultantId,
        NotificationType.SESSION_SCHEDULED,
        { therapy_id: proposition.therapy_id, scheduled_at: selectedSlot },
        tx
      );

      return updatedProposition;
    });
  }
}
