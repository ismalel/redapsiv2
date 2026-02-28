import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { ILogoutUseCase } from './auth.use-cases';

export class LogoutUseCase implements ILogoutUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(refreshToken: string): Promise<void> {
    try {
      await this.authRepository.revokeRefreshToken(refreshToken);
    } catch (err) {
      // Ignore if token not found or already revoked
    }
  }
}
