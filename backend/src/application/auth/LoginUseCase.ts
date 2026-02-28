import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { AuthResponse, TokenPair } from '../../domain/entities/auth';
import { ILoginUseCase, LoginInput } from './auth.use-cases';
import { ApiError } from '../../shared/apiError';

export class LoginUseCase implements ILoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(input: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmail(input.email);

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

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
