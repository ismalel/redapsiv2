import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TokenPair } from '../../domain/entities/auth';

export class TokenService {
  public generateTokenPair(userId: string, role: string): TokenPair {
    const accessTokenExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    const accessToken = jwt.sign(
      { sub: userId, role },
      process.env.JWT_SECRET!,
      { expiresIn: accessTokenExpiresIn }
    );

    const refreshToken = jwt.sign(
      { sub: userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: refreshTokenExpiresIn }
    );

    // Parse seconds from expiresIn string (simple version for 15m default)
    // In a real app we would use a library to parse human readable time to seconds
    const expiresInSeconds = this.parseExpiresIn(accessTokenExpiresIn);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
    };
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresIn(expiresIn: string): number {
    if (expiresIn.endsWith('m')) return parseInt(expiresIn) * 60;
    if (expiresIn.endsWith('h')) return parseInt(expiresIn) * 3600;
    if (expiresIn.endsWith('d')) return parseInt(expiresIn) * 86400;
    return parseInt(expiresIn) || 900;
  }
}
