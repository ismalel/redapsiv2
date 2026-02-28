import { SessionRequest, SessionRequestStatus, AvailabilityType, NotificationType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export interface CreateSessionRequestInput {
  therapy_id: string;
  proposed_at: Date;
  notes?: string;
}

export class CreateSessionRequestUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(consultantId: string, input: CreateSessionRequestInput): Promise<SessionRequest> {
    const therapy = await prisma.therapy.findUnique({
      where: { id: input.therapy_id },
    });

    if (!therapy || therapy.consultant_id !== consultantId) {
      throw ApiError.notFound('Terapia no encontrada', 'THERAPY_NOT_FOUND');
    }

    // 2. Resolve Psychologist Profile ID
    const profile = await prisma.psychologistProfile.findUnique({
      where: { user_id: therapy.psychologist_id },
      select: { id: true }
    });

    if (!profile) {
      throw ApiError.notFound('Perfil de psicóloga no encontrado', 'PSYCHOLOGIST_PROFILE_NOT_FOUND');
    }

    // 3. Validate proposed_at against psychologist's availability
    const dayOfWeek = input.proposed_at.getUTCDay();
    const timeStr = input.proposed_at.getUTCHours().toString().padStart(2, '0') + ':' + 
                    input.proposed_at.getUTCMinutes().toString().padStart(2, '0');

    const isAvailable = await prisma.availabilitySlot.findFirst({
      where: {
        psychologist_profile_id: profile.id,
        day_of_week: dayOfWeek,
        start_time: { lte: timeStr },
        end_time: { gt: timeStr },
        type: AvailabilityType.AVAILABLE,
      },
    });

    if (!isAvailable) {
      throw ApiError.badRequest('La psicóloga no tiene disponibilidad en el horario seleccionado', 'SLOT_NOT_AVAILABLE');
    }

    const request = await prisma.sessionRequest.create({
      data: {
        therapy_id: input.therapy_id,
        consultant_id: consultantId,
        proposed_at: input.proposed_at,
        notes: input.notes,
        status: SessionRequestStatus.PENDING,
      },
    });

    await this.notificationService.createNotification(
      therapy.psychologist_id,
      NotificationType.SESSION_REQUEST_RECEIVED,
      { therapy_id: therapy.id, session_request_id: request.id }
    );

    return request;
  }
}
