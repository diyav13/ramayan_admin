import type { UserRole } from "./user";

export type { UserRole } from "./user";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

/** Refresh endpoint returns tokens only (no user). */
export type RefreshTokenResponse = AuthTokens;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}
