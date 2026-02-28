import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { AuthResponse } from '../../domain/entities/auth';
import { ILoginUseCase, LoginInput } from './auth.use-cases';
import { ApiError } from '../../shared/apiError';
import { TokenService } from './TokenService';

export class LoginUseCase implements ILoginUseCase {
  private tokenService: TokenService;

  constructor(private authRepository: IAuthRepository) {
    this.tokenService = new TokenService();
  }

  async execute(input: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmail(input.email);

    if (!user || user.deleted_at) {
      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

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
