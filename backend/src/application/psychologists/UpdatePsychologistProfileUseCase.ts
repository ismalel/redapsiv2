import { PsychologistProfile } from '@prisma/client';
import { IPsychologistRepository } from '../../domain/repositories/IPsychologistRepository';
import { IUpdatePsychologistProfileUseCase } from './psychologists.use-cases';
import { ApiError } from '../../shared/apiError';

export class UpdatePsychologistProfileUseCase implements IUpdatePsychologistProfileUseCase {
  constructor(private psychologistRepository: IPsychologistRepository) {}

  async execute(userId: string, data: Partial<PsychologistProfile> & { avatar_url?: string }): Promise<PsychologistProfile> {
    // Only allow updating certain fields
    const { license_number, specializations, bio, session_fee, modalities, languages, years_experience, avatar_url } = data;
    
    try {
      return await this.psychologistRepository.updateProfile(userId, {
        license_number,
        specializations,
        bio,
        session_fee,
        modalities,
        languages,
        years_experience,
        avatar_url
      });
    } catch (error) {
       throw ApiError.badRequest('Could not update psychologist profile');
    }
  }
}
