import type { AuthTokens, AuthUser } from "@/types/auth";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_COOKIE_KEY,
  SESSION_COOKIE_MAX_AGE,
  USER_STORAGE_KEY,
} from "./constants";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setTokens(tokens: AuthTokens): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

function setStoredUser(user: AuthUser): void {
  if (!isBrowser()) return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function setSessionCookie(): void {
  if (!isBrowser()) return;
  document.cookie = `${SESSION_COOKIE_KEY}=1; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; samesite=lax`;
}

function clearSessionCookie(): void {
  if (!isBrowser()) return;
  document.cookie = `${SESSION_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function persistAuth(tokens: AuthTokens, user: AuthUser): void {
  setTokens(tokens);
  setStoredUser(user);
  setSessionCookie();
}

export function clearAuthStorage(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  clearSessionCookie();
}

export function hasSession(): boolean {
  return Boolean(getAccessToken() && getStoredUser());
}
