import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { AuthResponse } from '../../domain/entities/auth';
import { IRegisterUseCase, RegisterInput } from './auth.use-cases';
import { ApiError } from '../../shared/apiError';
import { TokenService } from './TokenService';
import { Role } from '@prisma/client';

export class RegisterUseCase implements IRegisterUseCase {
  private tokenService: TokenService;

  constructor(private authRepository: IAuthRepository) {
    this.tokenService = new TokenService();
  }

  async execute(input: RegisterInput): Promise<AuthResponse> {
    // Severity 1: Public register restriction
    if (input.role === Role.ADMIN || input.role === Role.ADMIN_PSYCHOLOGIST) {
      throw ApiError.forbidden('Cannot register as admin through public endpoint', 'INVALID_REGISTRATION_ROLE');
    }

    const existingUser = await this.authRepository.findByEmail(input.email);

    if (existingUser) {
      throw ApiError.conflict('Email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.authRepository.createUser({
      email: input.email,
      name: input.name,
      password_hash: passwordHash,
      role: input.role,
    });

    const tokens = this.tokenService.generateTokenPair(user.id, user.role);
    const hashedRefreshToken = this.tokenService.hashToken(tokens.refresh_token);

    const refreshTokenPayload = jwt.decode(tokens.refresh_token) as any;
    await this.authRepository.saveRefreshToken(
      user.id,
      hashedRefreshToken,
      new Date(refreshTokenPayload.exp * 1000)
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        must_change_password: user.must_change_password,
      },
    };
  }
}
