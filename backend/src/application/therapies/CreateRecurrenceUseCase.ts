import { Therapy, RecurrenceConfiguration, SessionType, SessionStatus, AvailabilityType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { ApiError } from '../../shared/apiError';

export interface CreateRecurrenceInput {
  therapy_id: string;
  day_of_week: number;
  start_time: string;
  duration: number;
  frequency: 'WEEKLY' | 'BIWEEKLY';
  sessions_count?: number;
  start_date: string;
}

export class CreateRecurrenceUseCase {
  async execute(psychologistId: string, input: CreateRecurrenceInput): Promise<RecurrenceConfiguration> {
    // 1. Verify therapy exists and belongs to psychologist
    const therapy = await prisma.therapy.findUnique({
      where: { id: input.therapy_id },
      include: { billing_plan: true }
    });

    if (!therapy || therapy.psychologist_id !== psychologistId) {
      throw ApiError.notFound('Terapia no encontrada', 'THERAPY_NOT_FOUND');
    }

    const startDate = new Date(input.start_date);
    const [hours, minutes] = input.start_time.split(':').map(Number);

    return await prisma.$transaction(async (tx) => {
      // 2. Create or Update RecurrenceConfiguration
      const recurrence = await tx.recurrenceConfiguration.upsert({
        where: { therapy_id: input.therapy_id },
        update: {
          day_of_week: input.day_of_week,
          start_time: input.start_time,
          duration: input.duration,
          frequency: input.frequency,
          sessions_count: input.sessions_count,
          start_date: startDate,
        },
        create: {
          therapy_id: input.therapy_id,
          day_of_week: input.day_of_week,
          start_time: input.start_time,
          duration: input.duration,
          frequency: input.frequency,
          sessions_count: input.sessions_count,
          start_date: startDate,
        }
      });

      // 3. Generate Sessions
      // If indefinite (sessions_count null), we generate for the next 12 weeks (3 months)
      const count = input.sessions_count || 12;
      const intervalDays = input.frequency === 'WEEKLY' ? 7 : 14;

      const sessionsToCreate = [];
      let currentSessionDate = new Date(startDate);
      
      // Adjust start_date to match the requested day_of_week if it doesn't match
      while (currentSessionDate.getDay() !== input.day_of_week) {
        currentSessionDate.setDate(currentSessionDate.getDate() + 1);
      }
      currentSessionDate.setHours(hours, minutes, 0, 0);

      for (let i = 0; i < count; i++) {
        sessionsToCreate.push({
          therapy_id: input.therapy_id,
          scheduled_at: new Date(currentSessionDate),
          duration: input.duration,
          type: SessionType.RECURRENT,
          status: SessionStatus.SCHEDULED,
          session_fee: therapy.billing_plan?.default_fee
        });
        
        currentSessionDate.setDate(currentSessionDate.getDate() + intervalDays);
      }

      // Delete future RECURRENT sessions before creating new ones to avoid duplicates/conflicts
      await tx.therapySession.deleteMany({
        where: {
          therapy_id: input.therapy_id,
          type: SessionType.RECURRENT,
          status: SessionStatus.SCHEDULED,
          scheduled_at: { gte: startDate }
        }
      });

      await tx.therapySession.createMany({
        data: sessionsToCreate
      });

      // 4. Block the slot in psychologist availability
      // Resolve Profile ID
      const profile = await tx.psychologistProfile.findUnique({
        where: { user_id: psychologistId },
        select: { id: true }
      });

      if (profile) {
        // Calculate end time
        const endMinutes = minutes + input.duration;
        const extraHours = Math.floor(endMinutes / 60);
        const finalMinutes = endMinutes % 60;
        const finalHours = hours + extraHours;
        const endTimeStr = `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;

        // Create a BLOCKED slot for this specific recurring therapy
        await tx.availabilitySlot.create({
          data: {
            psychologist_profile_id: profile.id,
            day_of_week: input.day_of_week,
            start_time: input.start_time,
            end_time: endTimeStr,
            type: AvailabilityType.BLOCKED
          }
        });
      }

      return recurrence;
    });
  }
}
