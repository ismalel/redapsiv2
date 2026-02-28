import { PsychologistProfile, AvailabilitySlot } from '@prisma/client';

export interface IPsychologistRepository {
  findById(id: string): Promise<(PsychologistProfile & { availability_slots: AvailabilitySlot[] }) | null>;
  findByUserId(userId: string): Promise<(PsychologistProfile & { availability_slots: AvailabilitySlot[] }) | null>;
  findAll(availableOnly?: boolean): Promise<(PsychologistProfile & { user: { name: string; avatar_url: string | null }; availability_slots: AvailabilitySlot[] })[]>;
  updateProfile(userId: string, data: Partial<PsychologistProfile> & { avatar_url?: string }): Promise<PsychologistProfile>;
  setAvailability(profileId: string, slots: { day_of_week: number; start_time: string; end_time: string; type: 'AVAILABLE' | 'BLOCKED' }[]): Promise<void>;
}
