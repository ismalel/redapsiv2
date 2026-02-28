import { ConsultantProfile } from '@prisma/client';
import { IConsultantRepository } from '../../domain/repositories/IConsultantRepository';
import { IGetConsultantProfileUseCase } from './consultants.use-cases';
import { ApiError } from '../../shared/apiError';

export class GetConsultantProfileUseCase implements IGetConsultantProfileUseCase {
  constructor(private consultantRepository: IConsultantRepository) {}

  async execute(userId: string): Promise<ConsultantProfile> {
    const profile = await this.consultantRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Consultant profile not found', 'CONSULTANT_PROFILE_NOT_FOUND');
    }
    return profile;
  }
}
