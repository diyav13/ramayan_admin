"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";
import type { QuizType } from "@/types/quiz";

type FilterOption = { value: string; label: string };

export function QuizFiltersBar({
  search,
  onSearchChange,
  onSearchClear,
  chapterId,
  onChapterChange,
  chapterOptions,
  episodeId,
  onEpisodeChange,
  episodeOptions,
  typeFilter,
  onTypeChange,
  typeOptions,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  chapterId: string;
  onChapterChange: (value: string) => void;
  chapterOptions: FilterOption[];
  episodeId: string;
  onEpisodeChange: (value: string) => void;
  episodeOptions: FilterOption[];
  typeFilter: QuizType | "";
  onTypeChange: (value: QuizType | "") => void;
  typeOptions: FilterOption[];
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={onSearchClear}
        placeholder="Search questions…"
      />
      <ToolbarSelect
        label="Filter by chapter"
        value={chapterId}
        onChange={(e) => onChapterChange(e.target.value)}
        options={chapterOptions}
        className="w-[14rem]"
      />
      <ToolbarSelect
        label="Filter by episode"
        value={episodeId}
        onChange={(e) => onEpisodeChange(e.target.value)}
        options={episodeOptions}
        className="w-[14rem]"
        disabled={!chapterId}
      />
      <ToolbarSelect
        label="Filter by type"
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value as QuizType | "")}
        options={typeOptions}
        className="w-[12rem]"
      />
    </div>
  );
}
