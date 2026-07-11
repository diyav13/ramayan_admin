/** Same-origin Next.js BFF routes for auth (client-safe, no env needed). */
export const AUTH_API_PREFIX = "/api/auth";

export const ACCESS_TOKEN_KEY = "ramayan_access_token";
export const REFRESH_TOKEN_KEY = "ramayan_refresh_token";
export const USER_STORAGE_KEY = "ramayan_user";

/** Lightweight cookie so proxy.ts can guard routes (tokens live in localStorage). */
export const SESSION_COOKIE_KEY = "ramayan_admin_session";

/** Max age for session cookie — 7 days (refresh token should outlive this). */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const ADMIN_ROLE = "ADMIN" as const;
