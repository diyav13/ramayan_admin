"use client";

import { SearchInput } from "@/components/ui/SearchInput";

export function InfoFiltersBar({
  search,
  onSearchChange,
  onSearchClear,
  placeholder = "Search…",
  disabled = false,
  loading = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <SearchInput
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      onClear={onSearchClear}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
    />
  );
}
