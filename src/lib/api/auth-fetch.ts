import { getAccessToken, clearAuthStorage } from "@/lib/auth/storage";
import { refreshTokens } from "@/lib/auth/service";
import { ApiError } from "./errors";

export type AuthFetchOptions = RequestInit & {
  /** Internal flag — do not retry after a refresh attempt. */
  _retried?: boolean;
};

let refreshPromise: Promise<void> | null = null;

function getRefreshLock(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens()
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function handleSessionExpired(): Promise<never> {
  clearAuthStorage();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
  throw new ApiError("Session expired. Please sign in again.", 401);
}

/**
 * Authenticated fetch with a single 401 → refresh → retry path.
 */
export async function authFetch(
  url: string,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { _retried, headers, ...rest } = options;
  const accessToken = getAccessToken();

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401 && !_retried) {
    try {
      await getRefreshLock();
      return authFetch(url, { ...options, _retried: true });
    } catch {
      return handleSessionExpired();
    }
  }

  return response;
}

export function extractErrorMessage(
  parsed: unknown,
  status: number,
  fallback: string
): string {
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "message" in parsed &&
    typeof (parsed as { message: unknown }).message === "string"
  ) {
    return (parsed as { message: string }).message;
  }

  return `${fallback} (${status})`;
}
