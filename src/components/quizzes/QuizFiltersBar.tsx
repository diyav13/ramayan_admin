"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import {
  ChapterFilterSelect,
  type ChapterFilterOption,
} from "@/components/episodes/ChapterFilterSelect";
import type { QuizType } from "@/types/quiz";

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
  disabled = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  chapterId: string;
  onChapterChange: (value: string) => void;
  chapterOptions: readonly ChapterFilterOption[];
  episodeId: string;
  onEpisodeChange: (value: string) => void;
  episodeOptions: readonly ChapterFilterOption[];
  typeFilter: QuizType | "";
  onTypeChange: (value: QuizType | "") => void;
  typeOptions: readonly ChapterFilterOption[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={onSearchClear}
        placeholder="Search questions…"
        disabled={disabled}
      />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        <ChapterFilterSelect
          label="Filter by chapter"
          value={chapterId}
          onChange={onChapterChange}
          options={chapterOptions}
          placeholder="All chapters"
          disabled={disabled}
          className="w-full"
        />
        <ChapterFilterSelect
          label="Filter by episode"
          value={episodeId}
          onChange={onEpisodeChange}
          options={episodeOptions}
          placeholder={chapterId ? "All episodes" : "Select chapter first"}
          disabled={disabled || !chapterId}
          className="w-full"
        />
        <ChapterFilterSelect
          label="Filter by type"
          value={typeFilter}
          onChange={(value) => onTypeChange(value as QuizType | "")}
          options={typeOptions}
          placeholder="All types"
          disabled={disabled}
          className="w-full sm:col-span-2 lg:col-span-1"
        />
      </div>
    </div>
  );
}
