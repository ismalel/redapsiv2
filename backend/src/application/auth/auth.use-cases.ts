import { AuthResponse, TokenPair } from '../../domain/entities/auth';
import { z } from 'zod';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from '../../shared/auth.schema';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface IRegisterUseCase {
  execute(input: RegisterInput): Promise<AuthResponse>;
}

export interface ILoginUseCase {
  execute(input: LoginInput): Promise<AuthResponse>;
}

export interface IRefreshTokenUseCase {
  execute(input: RefreshTokenInput): Promise<TokenPair>;
}

export interface ILogoutUseCase {
  execute(refreshToken: string): Promise<void>;
}

export interface IChangePasswordUseCase {
  execute(userId: string, input: ChangePasswordInput): Promise<void>;
}
