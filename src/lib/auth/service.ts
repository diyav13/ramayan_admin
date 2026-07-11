import { AUTH_API_PREFIX } from "./constants";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import { unwrapApiResponse } from "@/lib/api/response";
import type {
  AuthResponse,
  AuthTokens,
  LoginCredentials,
  RefreshTokenResponse,
} from "@/types/auth";
import { ADMIN_ROLE } from "./constants";
import {
  clearAuthStorage,
  getRefreshToken,
  getStoredUser,
  persistAuth,
  setTokens,
} from "./storage";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    throw new ApiError("Empty response from server", response.status);
  }
  return unwrapApiResponse<T>(JSON.parse(text));
}

function assertAdminAccess(user: AuthResponse["user"] | undefined): void {
  if (!user) {
    throw new ApiError("Invalid login response: user data missing", 500);
  }
  if (user.role !== ADMIN_ROLE) {
    throw new ApiError(
      "Access denied. Admin privileges are required.",
      403
    );
  }
}

/**
 * POST /api/auth/login — stores tokens and user after ADMIN role check.
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_PREFIX}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await parseJsonResponse<AuthResponse>(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(new ApiError("Login failed", response.status, data)),
      response.status,
      data
    );
  }

  assertAdminAccess(data.user);
  persistAuth(
    { accessToken: data.accessToken, refreshToken: data.refreshToken },
    data.user
  );

  return data;
}

/**
 * POST /api/auth/refresh-token — updates stored tokens.
 * Backend returns tokens only; existing user is kept from storage.
 */
export async function refreshTokens(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError("No refresh token available", 401);
  }

  const response = await fetch(`${AUTH_API_PREFIX}/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await parseJsonResponse<RefreshTokenResponse>(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(new ApiError("Token refresh failed", response.status, data)),
      response.status,
      data
    );
  }

  const user = getStoredUser();
  if (!user) {
    throw new ApiError("No user session found", 401);
  }

  setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}

/**
 * POST /api/auth/logout — invalidates server session and clears local tokens.
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    await fetch(`${AUTH_API_PREFIX}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
  } catch {
    // Always clear local state even if the server call fails.
  } finally {
    clearAuthStorage();
  }
}
