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
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={onSearchClear}
        placeholder="Search questions…"
      />
      <ChapterFilterSelect
        label="Filter by chapter"
        value={chapterId}
        onChange={onChapterChange}
        options={chapterOptions}
        placeholder="All chapters"
        className="w-[14rem]"
      />
      <ChapterFilterSelect
        label="Filter by episode"
        value={episodeId}
        onChange={onEpisodeChange}
        options={episodeOptions}
        placeholder={chapterId ? "All episodes" : "Select chapter first"}
        disabled={!chapterId}
        className="w-[14rem]"
      />
      <ChapterFilterSelect
        label="Filter by type"
        value={typeFilter}
        onChange={(value) => onTypeChange(value as QuizType | "")}
        options={typeOptions}
        placeholder="All types"
        className="w-[12rem]"
      />
    </div>
  );
}
