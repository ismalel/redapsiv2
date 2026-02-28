import { ConsultantProfile, OnboardingStatus } from '@prisma/client';
import { prisma } from '../database/prismaClient';
import { IConsultantRepository } from '../../domain/repositories/IConsultantRepository';

export class ConsultantRepository implements IConsultantRepository {
  async findById(id: string) {
    return prisma.consultantProfile.findUnique({
      where: { id }
    });
  }

  async findByUserId(userId: string) {
    return prisma.consultantProfile.findUnique({
      where: { user_id: userId }
    });
  }

  async updateProfile(userId: string, data: Partial<ConsultantProfile>) {
    const { user_id, id, ...updateData } = data as any;
    return prisma.consultantProfile.update({
      where: { user_id: userId },
      data: updateData
    });
  }

  async getOnboardingState(userId: string) {
    const profile = await prisma.consultantProfile.findUnique({
      where: { user_id: userId },
      select: {
        onboarding_status: true,
        onboarding_step: true,
        onboarding_data: true
      }
    });
    return profile;
  }

  async updateOnboardingStep(userId: string, step: number, data: any, isComplete?: boolean) {
    const profile = await prisma.consultantProfile.findUnique({
      where: { user_id: userId },
      select: { onboarding_data: true }
    });

    const currentData = (profile?.onboarding_data as Record<string, any>) || {};
    const newData = { ...currentData, [`step${step}`]: data };

    await prisma.consultantProfile.update({
      where: { user_id: userId },
      data: {
        onboarding_step: step,
        onboarding_data: newData,
        onboarding_status: isComplete ? OnboardingStatus.COMPLETED : OnboardingStatus.INCOMPLETE
      }
    });
  }
}
