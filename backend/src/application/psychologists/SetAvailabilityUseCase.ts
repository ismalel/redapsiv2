import { IPsychologistRepository } from '../../domain/repositories/IPsychologistRepository';
import { ISetAvailabilityUseCase } from './psychologists.use-cases';
import { ApiError } from '../../shared/apiError';

export class SetAvailabilityUseCase implements ISetAvailabilityUseCase {
  constructor(private psychologistRepository: IPsychologistRepository) {}

  async execute(userId: string, slots: { day_of_week: number; start_time: string; end_time: string; type: 'AVAILABLE' | 'BLOCKED' }[]): Promise<void> {
    const profile = await this.psychologistRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Psychologist profile not found', 'PSYCHOLOGIST_PROFILE_NOT_FOUND');
    }

    // Validate slots (basic validation)
    for (const slot of slots) {
      if (slot.day_of_week < 0 || slot.day_of_week > 6) {
        throw ApiError.badRequest('Invalid day of week', 'INVALID_DAY_OF_WEEK');
      }
      // HH:mm format check
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.start_time) || !timeRegex.test(slot.end_time)) {
        throw ApiError.badRequest('Invalid time format. Use HH:mm', 'INVALID_TIME_FORMAT');
      }
    }

    await this.psychologistRepository.setAvailability(profile.id, slots);
  }
}
