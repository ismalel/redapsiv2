import { IPsychologistRepository } from '../../domain/repositories/IPsychologistRepository';
import { IListPsychologistsUseCase, PsychologistWithAvailability } from './psychologists.use-cases';

export class ListPsychologistsUseCase implements IListPsychologistsUseCase {
  constructor(private psychologistRepository: IPsychologistRepository) {}

  async execute(availableOnly?: boolean): Promise<PsychologistWithAvailability[]> {
    return this.psychologistRepository.findAll(availableOnly);
  }
}
