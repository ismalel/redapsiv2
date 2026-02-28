import { IPsychologistRepository } from '../../domain/repositories/IPsychologistRepository';
import { IGetOwnPsychologistProfileUseCase, PsychologistWithAvailability } from './psychologists.use-cases';
import { ApiError } from '../../shared/apiError';

export class GetOwnPsychologistProfileUseCase implements IGetOwnPsychologistProfileUseCase {
  constructor(private psychologistRepository: IPsychologistRepository) {}

  async execute(userId: string): Promise<PsychologistWithAvailability> {
    const profile = await this.psychologistRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Psychologist profile not found', 'PSYCHOLOGIST_PROFILE_NOT_FOUND');
    }
    return profile;
  }
}
