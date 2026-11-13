"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import {
  ChapterFilterSelect,
  type ChapterFilterOption,
} from "@/components/episodes/ChapterFilterSelect";

export function EpisodeFiltersBar({
  search,
  onSearchChange,
  onSearchClear,
  chapterId,
  onChapterChange,
  chapterOptions,
  disabled = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  chapterId: string;
  onChapterChange: (value: string) => void;
  chapterOptions: readonly ChapterFilterOption[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <SearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={onSearchClear}
          placeholder="Search episodes by title…"
          disabled={disabled}
        />
      </div>
      <ChapterFilterSelect
        label="Filter by chapter"
        value={chapterId}
        onChange={onChapterChange}
        options={chapterOptions}
        disabled={disabled}
        className="w-full sm:w-[14rem]"
      />
    </div>
  );
}
