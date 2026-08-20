import type { PaginatedResult, PaginationMeta } from "@/types/api";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

export interface PageRange {
  from: number;
  to: number;
}

/** Compute "Showing X–Y" range from pagination metadata and current page items. */
export function computePageRange(
  pagination: PaginationMeta | null,
  itemsLength: number,
  enabled = true
): PageRange | null {
  if (!enabled || !pagination || itemsLength === 0) return null;

  return {
    from: (pagination.page - 1) * pagination.limit + 1,
    to: (pagination.page - 1) * pagination.limit + itemsLength,
  };
}

export function totalFromPagination(
  pagination: PaginationMeta | null,
  itemsLength: number
): number {
  return pagination?.total ?? itemsLength;
}

function positiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * Normalize list payloads so page length never exceeds `limit`.
 *
 * Handles backends that return pagination metadata but still send the full
 * collection in `data` (or an oversized page). When `data.length > limit`,
 * the current page is sliced client-side.
 */
export function normalizePaginatedResult<T>(
  result: PaginatedResult<T>,
  options?: { page?: number; limit?: number }
): PaginatedResult<T> {
  const rawData = Array.isArray(result.data) ? result.data : [];
  const hasPaging =
    Boolean(result.pagination) || options?.limit !== undefined;

  if (!hasPaging) {
    return { data: rawData };
  }

  const limit = positiveInt(
    result.pagination?.limit ?? options?.limit,
    DEFAULT_LIMIT
  );
  const requestedPage = positiveInt(
    options?.page ?? result.pagination?.page,
    DEFAULT_PAGE
  );
  const total = Math.max(
    0,
    result.pagination?.total !== undefined
      ? positiveInt(result.pagination.total, rawData.length)
      : rawData.length
  );
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const page = Math.min(requestedPage, totalPages);

  let data = rawData;

  // Server ignored limit / returned the full collection for every page.
  if (data.length > limit) {
    const start = (page - 1) * limit;
    data = data.slice(start, start + limit);
  }

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/** Read page/limit from a path like `/users/admin/all?page=2&limit=10`. */
export function parseListQueryParams(path: string): {
  page?: number;
  limit?: number;
} {
  const qIndex = path.indexOf("?");
  if (qIndex === -1) return {};

  const params = new URLSearchParams(path.slice(qIndex + 1));
  const page = Number(params.get("page"));
  const limit = Number(params.get("limit"));

  return {
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : undefined,
    limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : undefined,
  };
}
