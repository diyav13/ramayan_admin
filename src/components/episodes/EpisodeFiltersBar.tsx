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
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  chapterId: string;
  onChapterChange: (value: string) => void;
  chapterOptions: readonly ChapterFilterOption[];
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={onSearchClear}
        placeholder="Search episodes by title…"
      />
      <ChapterFilterSelect
        label="Filter by chapter"
        value={chapterId}
        onChange={onChapterChange}
        options={chapterOptions}
        className="w-[14rem]"
      />
    </div>
  );
}
