import bcrypt from 'bcrypt';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IChangePasswordUseCase, ChangePasswordInput } from './auth.use-cases';
import { ApiError } from '../../shared/apiError';

export class ChangePasswordUseCase implements IChangePasswordUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    const isPasswordValid = await bcrypt.compare(input.current_password, user.password_hash);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid current password', 'INVALID_CURRENT_PASSWORD');
    }

    const newPasswordHash = await bcrypt.hash(input.new_password, 12);
    await this.authRepository.updatePassword(userId, newPasswordHash);
  }
}
