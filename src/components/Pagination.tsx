import { Button } from "@/components/ui/Button";
import type { PaginationMeta } from "@/types/api";

export function Pagination({
  pagination,
  page,
  onPageChange,
  loading = false,
  summary,
}: {
  pagination: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  summary?: string;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-muted)]">
        {summary ?? `Page ${pagination.page} of ${pagination.totalPages}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs font-medium text-[var(--text-muted)]">
          {page} / {pagination.totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= pagination.totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
