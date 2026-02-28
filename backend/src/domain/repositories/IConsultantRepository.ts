import { ConsultantProfile } from '@prisma/client';

export interface IConsultantRepository {
  findById(id: string): Promise<ConsultantProfile | null>;
  findByUserId(userId: string): Promise<ConsultantProfile | null>;
  updateProfile(userId: string, data: Partial<ConsultantProfile>): Promise<ConsultantProfile>;
  getOnboardingState(userId: string): Promise<{ onboarding_status: string; onboarding_step: number; onboarding_data: any } | null>;
  updateOnboardingStep(userId: string, step: number, data: any, isComplete?: boolean): Promise<void>;
}
