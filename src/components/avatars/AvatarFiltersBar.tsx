"use client";

import { SearchInput } from "@/components/ui/SearchInput";

export function AvatarFiltersBar({
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
      onChange={(event) => onSearchChange(event.target.value)}
      onClear={onSearchClear}
      placeholder="Search avatars…"
      disabled={disabled}
    />
  );
}
