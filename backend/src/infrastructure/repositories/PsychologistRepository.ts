import { PsychologistProfile, AvailabilitySlot } from '@prisma/client';
import { prisma } from '../database/prismaClient';
import { IPsychologistRepository } from '../../domain/repositories/IPsychologistRepository';

export class PsychologistRepository implements IPsychologistRepository {
  async findById(id: string) {
    return prisma.psychologistProfile.findUnique({
      where: { id },
      include: { availability_slots: true }
    });
  }

  async findByUserId(userId: string) {
    return prisma.psychologistProfile.findUnique({
      where: { user_id: userId },
      include: { availability_slots: true }
    });
  }

  async findAll(availableOnly?: boolean) {
    return prisma.psychologistProfile.findMany({
      where: availableOnly ? { availability_slots: { some: {} } } : {},
      include: {
        user: {
          select: {
            name: true,
            avatar_url: true,
          }
        },
        availability_slots: true
      }
    });
  }

  async updateProfile(userId: string, data: Partial<PsychologistProfile> & { avatar_url?: string }) {
    const { avatar_url, ...profileData } = data;

    if (avatar_url !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatar_url }
      });
    }

    return prisma.psychologistProfile.update({
      where: { user_id: userId },
      data: profileData
    });
  }

  async setAvailability(profileId: string, slots: { day_of_week: number; start_time: string; end_time: string; type: 'AVAILABLE' | 'BLOCKED' }[]) {
    await prisma.$transaction([
      prisma.availabilitySlot.deleteMany({
        where: { psychologist_profile_id: profileId }
      }),
      prisma.availabilitySlot.createMany({
        data: slots.map(slot => ({
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          type: slot.type,
          psychologist_profile_id: profileId
        }))
      })
    ]);
  }
}
