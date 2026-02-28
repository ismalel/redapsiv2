import { ConsultantProfile } from '@prisma/client';
import { IConsultantRepository } from '../../domain/repositories/IConsultantRepository';
import { IUpdateConsultantProfileUseCase } from './consultants.use-cases';
import { ApiError } from '../../shared/apiError';

export class UpdateConsultantProfileUseCase implements IUpdateConsultantProfileUseCase {
  constructor(private consultantRepository: IConsultantRepository) {}

  async execute(userId: string, data: Partial<ConsultantProfile>): Promise<ConsultantProfile> {
    const { birth_date, phone, emergency_contact } = data;
    try {
      return await this.consultantRepository.updateProfile(userId, {
        birth_date,
        phone,
        emergency_contact
      });
    } catch (error) {
      throw ApiError.badRequest('Could not update consultant profile');
    }
  }
}
