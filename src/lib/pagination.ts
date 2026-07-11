import type { PaginationMeta } from "@/types/api";

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
