import { User, Role } from '@prisma/client';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createUser(data: { email: string; password_hash: string; name: string; role: Role }): Promise<User>;
  saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  findRefreshToken(token: string): Promise<{ user_id: string; revoked: boolean; expires_at: Date } | null>;
  revokeRefreshToken(token: string): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}
