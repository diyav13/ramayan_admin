import { getApiBaseUrl } from "./config";
import { ApiError } from "./errors";
import { unwrapApiResponse } from "./response";

type ServerFetchOptions = RequestInit & {
  /** Skip JSON content-type header (e.g. for file uploads). */
  rawBody?: boolean;
};

/**
 * Server-side fetch to the backend API.
 * Used by Next.js Route Handlers (BFF layer).
 */
export async function serverFetch<T = unknown>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<{ data: T; response: Response }> {
  const { rawBody, headers, ...rest } = options;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...(rawBody ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, parsed);
  }

  const data = unwrapApiResponse<T>(parsed);
  return { data, response };
}
