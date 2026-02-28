import { TherapyRequest, TherapyRequestStatus, TherapyOrigin, TherapyStatus, NotificationType, Role } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ApiError } from '../../shared/apiError';
import { NotificationService } from '../notifications/NotificationService';

export interface CreateTherapyRequestInput {
  psychologist_id: string;
  message?: string;
}

export class CreateTherapyRequestUseCase {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async execute(consultantId: string, input: CreateTherapyRequestInput): Promise<TherapyRequest> {
    // 1. Resolve psychologist User ID (in case a Profile ID was provided)
    let psychologistUserId = input.psychologist_id;
    
    const psychologistUser = await prisma.user.findUnique({
      where: { id: input.psychologist_id },
      select: { id: true, role: true }
    });

    if (!psychologistUser || (psychologistUser.role !== Role.PSYCHOLOGIST && psychologistUser.role !== Role.ADMIN_PSYCHOLOGIST)) {
      // Try finding by Profile ID
      const profile = await prisma.psychologistProfile.findUnique({
        where: { id: input.psychologist_id },
        select: { user_id: true }
      });

      if (!profile) {
        throw ApiError.notFound('Psicóloga no encontrada', 'PSYCHOLOGIST_NOT_FOUND');
      }
      psychologistUserId = profile.user_id;
    }

    // 2. Check if consultant already has an ACTIVE therapy
    const activeTherapy = await prisma.therapy.findFirst({
      where: { consultant_id: consultantId, status: TherapyStatus.ACTIVE },
    });

    if (activeTherapy) {
      throw ApiError.conflict('Ya tienes una terapia activa', 'CONSULTANT_HAS_ACTIVE_THERAPY');
    }

    // 3. Check if a pending request already exists
    const existingRequest = await prisma.therapyRequest.findFirst({
      where: {
        consultant_id: consultantId,
        psychologist_id: psychologistUserId,
        status: TherapyRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw ApiError.conflict('Ya tienes una solicitud pendiente con esta psicóloga', 'DUPLICATE_THERAPY_REQUEST');
    }

    // 4. Create request
    const request = await prisma.therapyRequest.create({
      data: {
        consultant_id: consultantId,
        psychologist_id: psychologistUserId,
        message: input.message,
      },
    });

    // 5. Notify psychologist
    await this.notificationService.createNotification(
      psychologistUserId,
      NotificationType.THERAPY_REQUEST_RECEIVED,
      { therapy_request_id: request.id, consultant_id: consultantId }
    );

    return request;
  }
}
