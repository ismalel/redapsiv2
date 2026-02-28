import { IConsultantRepository } from '../../domain/repositories/IConsultantRepository';
import { ISubmitOnboardingStepUseCase } from './consultants.use-cases';
import { ApiError } from '../../shared/apiError';
import { prisma } from '../../infrastructure/database/prismaClient';
import { TherapyStatus } from '@prisma/client';

export class SubmitOnboardingStepUseCase implements ISubmitOnboardingStepUseCase {
  constructor(private consultantRepository: IConsultantRepository) {}

  async execute(userId: string, step: number, data: any): Promise<void> {
    if (step < 1 || step > 6) {
      throw ApiError.badRequest('Invalid onboarding step', 'INVALID_ONBOARDING_STEP');
    }

    const profile = await this.consultantRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Consultant profile not found', 'CONSULTANT_PROFILE_NOT_FOUND');
    }

    const isComplete = step === 6;
    
    await prisma.$transaction(async (tx) => {
      // 1. Get current data to perform incremental update
      const profile = await tx.consultantProfile.findUnique({
        where: { user_id: userId },
        select: { onboarding_data: true }
      });

      const currentData = (profile?.onboarding_data as Record<string, any>) || {};
      const newData = { ...currentData, [`step${step}`]: data };

      // 2. Update profile with new data and step
      await tx.consultantProfile.update({
        where: { user_id: userId },
        data: {
          onboarding_step: step,
          onboarding_data: newData,
          onboarding_status: isComplete ? 'COMPLETED' : 'INCOMPLETE'
        }
      });

      // 3. If onboarding is complete, activate any PENDING therapy for this consultant
      if (isComplete) {
        await tx.therapy.updateMany({
          where: {
            consultant_id: userId,
            status: TherapyStatus.PENDING
          },
          data: {
            status: TherapyStatus.ACTIVE
          }
        });
      }
    });
  }
}
