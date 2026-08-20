"use client";

import { SearchInput } from "@/components/ui/SearchInput";

export function AvatarFiltersBar({
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
      onChange={(event) => onSearchChange(event.target.value)}
      onClear={onSearchClear}
      placeholder="Search avatars…"
    />
  );
}
