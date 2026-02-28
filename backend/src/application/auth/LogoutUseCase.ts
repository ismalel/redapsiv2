import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { ILogoutUseCase } from './auth.use-cases';
import { TokenService } from './TokenService';

export class LogoutUseCase implements ILogoutUseCase {
  private tokenService: TokenService;

  constructor(private authRepository: IAuthRepository) {
    this.tokenService = new TokenService();
  }

  async execute(refreshToken: string): Promise<void> {
    try {
      const hashedRefreshToken = this.tokenService.hashToken(refreshToken);
      await this.authRepository.revokeRefreshToken(hashedRefreshToken);
    } catch (err) {
      // Ignore if token not found or already revoked
    }
  }
}
