import { IPsychologistRepository } from '../../domain/repositories/IPsychologistRepository';
import { IGetPsychologistProfileUseCase, PsychologistWithAvailability } from './psychologists.use-cases';
import { ApiError } from '../../shared/apiError';

export class GetPsychologistProfileUseCase implements IGetPsychologistProfileUseCase {
  constructor(private psychologistRepository: IPsychologistRepository) {}

  async execute(id: string): Promise<PsychologistWithAvailability> {
    const profile = await this.psychologistRepository.findById(id);
    if (!profile) {
      throw ApiError.notFound('Psychologist not found', 'PSYCHOLOGIST_NOT_FOUND');
    }
    return profile;
  }
}
