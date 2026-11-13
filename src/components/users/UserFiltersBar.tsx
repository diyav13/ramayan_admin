"use client";

import { SearchInput } from "@/components/ui/SearchInput";

export function UserFiltersBar({
  search,
  onSearchChange,
  onSearchClear,
  disabled = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  disabled?: boolean;
}) {
  return (
    <SearchInput
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      onClear={onSearchClear}
      placeholder="Search name, email, or phone…"
      disabled={disabled}
    />
  );
}
