import jwt from 'jsonwebtoken';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { TokenPair } from '../../domain/entities/auth';
import { IRefreshTokenUseCase, RefreshTokenInput } from './auth.use-cases';
import { ApiError } from '../../shared/apiError';
import { TokenService } from './TokenService';

export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  private tokenService: TokenService;

  constructor(private authRepository: IAuthRepository) {
    this.tokenService = new TokenService();
  }

  async execute(input: RefreshTokenInput): Promise<TokenPair> {
    const { refresh_token } = input;

    try {
      jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET!);
    } catch (err) {
      throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const hashedRefreshToken = this.tokenService.hashToken(refresh_token);
    const storedToken = await this.authRepository.findRefreshToken(hashedRefreshToken);

    if (!storedToken || storedToken.revoked || new Date() > storedToken.expires_at) {
      throw ApiError.unauthorized('Refresh token expired or revoked', 'INVALID_REFRESH_TOKEN');
    }

    const user = await this.authRepository.findById(storedToken.user_id);

    if (!user || user.deleted_at) {
      throw ApiError.unauthorized('User not found or inactive', 'USER_INACTIVE');
    }

    const tokens = this.tokenService.generateTokenPair(user.id, user.role);
    const newHashedRefreshToken = this.tokenService.hashToken(tokens.refresh_token);

    // Revoke old token and save new one
    await this.authRepository.revokeRefreshToken(hashedRefreshToken);
    
    const refreshTokenPayload = jwt.decode(tokens.refresh_token) as any;
    await this.authRepository.saveRefreshToken(
      user.id,
      newHashedRefreshToken,
      new Date(refreshTokenPayload.exp * 1000)
    );

    return tokens;
  }
}
