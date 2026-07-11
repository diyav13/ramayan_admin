"use client";

import { SearchInput } from "@/components/ui/SearchInput";

export function InfoFiltersBar({
  search,
  onSearchChange,
  onSearchClear,
  placeholder = "Search…",
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  placeholder?: string;
}) {
  return (
    <SearchInput
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      onClear={onSearchClear}
      placeholder={placeholder}
    />
  );
}
