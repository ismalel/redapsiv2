import { Role } from '@prisma/client';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  must_change_password: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: TokenPair;
}
