"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";

type FilterOption = { value: string; label: string };

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
  chapterOptions: FilterOption[];
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={onSearchClear}
        placeholder="Search episodes by title…"
      />
      <ToolbarSelect
        label="Filter by chapter"
        value={chapterId}
        onChange={(e) => onChapterChange(e.target.value)}
        options={chapterOptions}
        className="w-[14rem]"
      />
    </div>
  );
}
