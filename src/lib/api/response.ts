import type { PaginationMeta } from "@/types/api";

/** Standard envelope from ramayana-server ApiResponse helper. */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedEnvelope<T> extends ApiEnvelope<T> {
  pagination: PaginationMeta;
}

function isApiEnvelope<T>(body: unknown): body is ApiEnvelope<T> {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    "data" in body &&
    (body as ApiEnvelope<T>).success === true
  );
}

function isPaginatedEnvelope<T>(body: unknown): body is PaginatedEnvelope<T> {
  return isApiEnvelope<T>(body) && "pagination" in body;
}

/** Unwrap `{ success, data }` or return the body if already flat. */
export function unwrapApiResponse<T>(body: unknown): T {
  if (isApiEnvelope<T>(body)) {
    return body.data;
  }
  return body as T;
}

/** Unwrap list responses that may include pagination metadata. */
export function unwrapListResponse<T>(body: unknown): {
  data: T[];
  pagination?: PaginationMeta;
} {
  if (isPaginatedEnvelope<T[]>(body)) {
    return { data: body.data, pagination: body.pagination };
  }

  const data = unwrapApiResponse<T[]>(body);
  return { data: Array.isArray(data) ? data : [] };
}
