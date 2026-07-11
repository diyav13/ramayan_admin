"use client";

import { SearchInput } from "@/components/ui/SearchInput";

export function UserFiltersBar({
  search,
  onSearchChange,
  onSearchClear,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
}) {
  return (
    <SearchInput
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      onClear={onSearchClear}
      placeholder="Search name, email, or phone…"
    />
  );
}
