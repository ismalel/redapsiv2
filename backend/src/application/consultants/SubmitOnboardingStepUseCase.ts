import { IConsultantRepository } from '../../domain/repositories/IConsultantRepository';
import { ISubmitOnboardingStepUseCase } from './consultants.use-cases';
import { ApiError } from '../../shared/apiError';

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
    await this.consultantRepository.updateOnboardingStep(userId, step, data, isComplete);
  }
}
