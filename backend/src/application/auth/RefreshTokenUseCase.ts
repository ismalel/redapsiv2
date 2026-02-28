import jwt from 'jsonwebtoken';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { TokenPair } from '../../domain/entities/auth';
import { IRefreshTokenUseCase, RefreshTokenInput } from './auth.use-cases';
import { ApiError } from '../../shared/apiError';

export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(input: RefreshTokenInput): Promise<TokenPair> {
    const { refresh_token } = input;

    try {
      jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET!);
    } catch (err) {
      throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const storedToken = await this.authRepository.findRefreshToken(refresh_token);

    if (!storedToken || storedToken.revoked || new Date() > storedToken.expires_at) {
      throw ApiError.unauthorized('Refresh token expired or revoked', 'INVALID_REFRESH_TOKEN');
    }

    const user = await this.authRepository.findById(storedToken.user_id);

    if (!user || user.deleted_at) {
      throw ApiError.unauthorized('User not found or inactive', 'USER_INACTIVE');
    }

    const tokens = this.generateTokenPair(user.id, user.role);

    await this.authRepository.revokeRefreshToken(refresh_token);
    
    const refreshTokenPayload = jwt.decode(tokens.refresh_token) as any;
    await this.authRepository.saveRefreshToken(
      user.id,
      tokens.refresh_token,
      new Date(refreshTokenPayload.exp * 1000)
    );

    return tokens;
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
