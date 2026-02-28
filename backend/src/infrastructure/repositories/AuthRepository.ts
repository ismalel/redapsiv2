import { User, Role } from '@prisma/client';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { prisma } from '../database/prismaClient';

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: { email: string; password_hash: string; name: string; role: Role }): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        must_change_password: false, 
      },
    });
  }

  async saveRefreshToken(userId: string, hashedToken: string, expiresAt: Date): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        user_id: userId,
        token: hashedToken,
        expires_at: expiresAt,
      },
    });
  }

  async findRefreshToken(hashedToken: string): Promise<{ user_id: string; revoked: boolean; expires_at: Date } | null> {
    return prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      select: { user_id: true, revoked: true, expires_at: true },
    });
  }

  async revokeRefreshToken(hashedToken: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { token: hashedToken },
      data: { revoked: true },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password_hash: passwordHash,
        must_change_password: false
      },
    });
  }
}
