import { ScheduleProposition, PropositionStatus, NotificationType, AvailabilityType, SessionType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export interface CreatePropositionInput {
  therapy_id: string;
  proposed_slots: Date[];
  type?: SessionType;
}

export class CreatePropositionUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(psychologistId: string, input: CreatePropositionInput): Promise<ScheduleProposition> {
    // 1. Verify therapy exists and belongs to psychologist
    const therapy = await prisma.therapy.findUnique({
      where: { id: input.therapy_id },
    });

    if (!therapy || therapy.psychologist_id !== psychologistId) {
      throw ApiError.notFound('Terapia no encontrada', 'THERAPY_NOT_FOUND');
    }

    // 2. Resolve Profile ID
    const profile = await prisma.psychologistProfile.findUnique({
      where: { user_id: psychologistId },
      select: { id: true }
    });

    if (!profile) {
      throw ApiError.notFound('Perfil de psicóloga no encontrado', 'PSYCHOLOGIST_PROFILE_NOT_FOUND');
    }

    // 3. Validate proposed slots against psychologist's AvailabilitySlots
    const availability = await prisma.availabilitySlot.findMany({
      where: { psychologist_profile_id: profile.id, type: AvailabilityType.AVAILABLE },
    });

    for (const date of input.proposed_slots) {
      const dayOfWeek = date.getUTCDay();
      const timeStr = date.getUTCHours().toString().padStart(2, '0') + ':' + 
                      date.getUTCMinutes().toString().padStart(2, '0');

      const isAvailable = availability.some(slot => {
        return slot.day_of_week === dayOfWeek && 
               timeStr >= slot.start_time && 
               timeStr < slot.end_time;
      });

      if (!isAvailable) {
        throw ApiError.badRequest(
          `El horario ${date.toISOString()} no coincide con tu disponibilidad configurada`,
          'SLOT_NOT_AVAILABLE'
        );
      }
    }

    // 3. Create proposition
    const proposition = await prisma.scheduleProposition.create({
      data: {
        therapy_id: input.therapy_id,
        proposed_slots: input.proposed_slots,
        status: PropositionStatus.PENDING,
        type: input.type || SessionType.INITIAL,
      },
    });

    // 4. Notify consultant
    await this.notificationService.createNotification(
      therapy.consultant_id,
      NotificationType.PROPOSITION_RECEIVED,
      { therapy_id: therapy.id, proposition_id: proposition.id }
    );

    return proposition;
  }
}
