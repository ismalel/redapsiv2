import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { AuthResponse, TokenPair } from '../../domain/entities/auth';
import { IRegisterUseCase, RegisterInput } from './auth.use-cases';
import { ApiError } from '../../shared/apiError';

export class RegisterUseCase implements IRegisterUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(input: RegisterInput): Promise<AuthResponse> {
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

    const tokens = this.generateTokenPair(user.id, user.role);

    const refreshTokenPayload = jwt.decode(tokens.refresh_token) as any;
    await this.authRepository.saveRefreshToken(
      user.id,
      tokens.refresh_token,
      new Date(refreshTokenPayload.exp * 1000)
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        must_change_password: user.must_change_password,
      },
      tokens,
    };
  }

  private generateTokenPair(userId: string, role: string): TokenPair {
    const accessToken = jwt.sign(
      { sub: userId, role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { sub: userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900,
    };
  }
}
