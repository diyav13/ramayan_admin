"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";

export type AvatarStatusFilter = "all" | "active" | "inactive";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active only" },
  { value: "inactive", label: "Inactive only" },
] as const;

export function AvatarFiltersBar({
  search,
  onSearchChange,
  onSearchClear,
  statusFilter,
  onStatusFilterChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  statusFilter: AvatarStatusFilter;
  onStatusFilterChange: (value: AvatarStatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onClear={onSearchClear}
        placeholder="Search avatars…"
        className="min-w-0 flex-1"
      />
      <ToolbarSelect
        label="Status filter"
        value={statusFilter}
        onChange={(event) =>
          onStatusFilterChange(event.target.value as AvatarStatusFilter)
        }
        options={STATUS_OPTIONS}
        className="w-full sm:w-44"
      />
    </div>
  );
}
