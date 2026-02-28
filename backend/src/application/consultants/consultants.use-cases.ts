import { ConsultantProfile, OnboardingStatus } from '@prisma/client';

export interface IGetConsultantProfileUseCase {
  execute(userId: string): Promise<ConsultantProfile>;
}

export interface IUpdateConsultantProfileUseCase {
  execute(userId: string, data: Partial<ConsultantProfile>): Promise<ConsultantProfile>;
}

export interface IGetOnboardingUseCase {
  execute(userId: string): Promise<{ onboarding_status: OnboardingStatus; onboarding_step: number; onboarding_data: any }>;
}

export interface ISubmitOnboardingStepUseCase {
  execute(userId: string, step: number, data: any): Promise<void>;
}
