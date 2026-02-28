import { OnboardingStatus } from '@prisma/client';
import { IConsultantRepository } from '../../domain/repositories/IConsultantRepository';
import { IGetOnboardingUseCase } from './consultants.use-cases';
import { ApiError } from '../../shared/apiError';

export class GetOnboardingUseCase implements IGetOnboardingUseCase {
  constructor(private consultantRepository: IConsultantRepository) {}

  async execute(userId: string): Promise<{ onboarding_status: OnboardingStatus; onboarding_step: number; onboarding_data: any }> {
    const state = await this.consultantRepository.getOnboardingState(userId);
    if (!state) {
      throw ApiError.notFound('Consultant profile not found', 'CONSULTANT_PROFILE_NOT_FOUND');
    }
    return state as { onboarding_status: OnboardingStatus; onboarding_step: number; onboarding_data: any };
  }
}
