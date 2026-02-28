import { PsychologistProfile, AvailabilitySlot } from '@prisma/client';

export type PsychologistWithAvailability = PsychologistProfile & { 
  availability_slots: AvailabilitySlot[];
  user?: { name: string; avatar_url: string | null };
};

export interface IListPsychologistsUseCase {
  execute(availableOnly?: boolean): Promise<PsychologistWithAvailability[]>;
}

export interface IGetPsychologistProfileUseCase {
  execute(id: string): Promise<PsychologistWithAvailability>;
}

export interface IGetOwnPsychologistProfileUseCase {
  execute(userId: string): Promise<PsychologistWithAvailability>;
}

export interface IUpdatePsychologistProfileUseCase {
  execute(userId: string, data: Partial<PsychologistProfile>): Promise<PsychologistProfile>;
}

export interface ISetAvailabilityUseCase {
  execute(userId: string, slots: { day_of_week: number; start_time: string; end_time: string; type: 'AVAILABLE' | 'BLOCKED' }[]): Promise<void>;
}
