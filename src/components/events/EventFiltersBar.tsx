"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";

export function EventFiltersBar({
  search,
  onSearchChange,
  onSearchClear,
  locationId,
  onLocationChange,
  locationOptions,
  disabled = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  locationId: string;
  onLocationChange: (value: string) => void;
  locationOptions: readonly { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <SearchInput
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={onSearchClear}
          placeholder="Search events by name, place, or people…"
          disabled={disabled}
        />
      </div>
      <ToolbarSelect
        label="Filter by location"
        value={locationId}
        onChange={(event) => onLocationChange(event.target.value)}
        disabled={disabled}
        className="w-full sm:w-[12rem]"
        options={[
          { value: "", label: "All locations" },
          ...locationOptions,
        ]}
      />
    </div>
  );
}
