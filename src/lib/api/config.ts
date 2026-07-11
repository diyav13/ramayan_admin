/** Server-only backend base URL (no trailing slash). */
export function getApiBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL is not configured");
  }
  return url.replace(/\/$/, "");
}

/**
 * Client-side API base URL.
 * Auth calls use same-origin `/api/auth/*` BFF routes.
 * Data calls use NEXT_PUBLIC_API_BASE_URL when set, otherwise `/api`.
 */
export function getClientApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (publicUrl) {
    return publicUrl.replace(/\/$/, "");
  }
  return "/api";
}

