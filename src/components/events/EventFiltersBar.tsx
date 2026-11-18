"use client";

import {
  ChapterFilterSelect,
  type ChapterFilterOption,
} from "@/components/episodes/ChapterFilterSelect";
import { SearchInput } from "@/components/ui/SearchInput";

export function EventFiltersBar({
  search,
  onSearchChange,
  onSearchClear,
  chapterId,
  onChapterChange,
  chapterOptions,
  locationId,
  onLocationChange,
  locationOptions,
  disabled = false,
  loading = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  chapterId: string;
  onChapterChange: (value: string) => void;
  chapterOptions: readonly ChapterFilterOption[];
  locationId: string;
  onLocationChange: (value: string) => void;
  locationOptions: readonly ChapterFilterOption[];
  disabled?: boolean;
  loading?: boolean;
}) {
  const chapterFilterOptions: ChapterFilterOption[] = [
    { value: "", label: "All chapters" },
    ...chapterOptions,
  ];

  const locationFilterOptions: ChapterFilterOption[] = [
    { value: "", label: "All locations" },
    ...locationOptions,
  ];

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <SearchInput
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={onSearchClear}
          placeholder="Search events by name, place, or people…"
          disabled={disabled}
          loading={loading}
        />
      </div>
      <ChapterFilterSelect
        label="Filter by chapter"
        value={chapterId}
        onChange={onChapterChange}
        options={chapterFilterOptions}
        disabled={disabled}
        className="w-full sm:w-[14rem]"
      />
      <ChapterFilterSelect
        label="Filter by location"
        value={locationId}
        onChange={onLocationChange}
        options={locationFilterOptions}
        disabled={disabled}
        className="w-full sm:w-[14rem]"
      />
    </div>
  );
}
