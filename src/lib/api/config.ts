/** Server-only backend base URL (no trailing slash). */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  return url.replace(/\/$/, "");
}

/**
 * Client-side API base URL.
 * Auth calls use same-origin `/api/auth/*` BFF routes.
 * Data calls use NEXT_PUBLIC_API_BASE_URL only when you intentionally
 * call the backend directly from the browser; otherwise `/api` (BFF proxy).
 */
export function getClientApiBaseUrl(): string {
  return "/api";
}

