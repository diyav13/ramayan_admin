"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable, columnHideClass } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PublishBadge } from "@/components/StatusBadges";
import { EpisodeEntityDetails } from "@/components/episodes/EpisodeEntityDetails";
import { EpisodeFiltersBar } from "@/components/episodes/EpisodeFiltersBar";
import { EpisodeForm } from "@/components/episodes/EpisodeForm";
import { ListState } from "@/components/ListState";
import { Pagination } from "@/components/Pagination";
import { useEpisodes } from "@/hooks/useEpisodes";
import {
  resolveEpisodeChapterAccentColor,
  resolveEpisodeChapterEpisodeCount,
  resolveEpisodeChapterTitle,
} from "@/lib/episodes";
import { pluralize } from "@/lib/utils";
import type {
  CreateEpisodeInput,
  Episode,
  UpdateEpisodeInput,
} from "@/types/episode";

const columns = [
  { label: "#", width: "5.5rem" }, // "N of N" index label
  { label: "Episode" }, // fluid identity column (thumb + title)
  { label: "Chapter", hideBelow: "md" as const, width: "9rem" },
  { label: "Status", hideBelow: "md" as const, width: "6.5rem" },
  { label: "Actions", align: "right" as const, width: "7.5rem" }, // 3 icon buttons
];

const hideMd = columnHideClass("md");
const SKELETON_ROWS = 6;

const episodeThumbClass =
  "h-8 w-11 shrink-0 rounded-md object-cover ring-1 ring-white/10 sm:h-10 sm:w-14 sm:rounded-lg";

const cellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";

function EpisodeThumb({
  title,
  thumbnailUrl,
}: {
  title: string;
  thumbnailUrl: string | null;
}) {
  if (thumbnailUrl) {
    return (
      <img src={thumbnailUrl} alt={title} className={episodeThumbClass} />
    );
  }

  const initial = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-semibold text-[var(--gold)] sm:text-base ${episodeThumbClass}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function EpisodeIndexLabel({
  index,
  total,
}: {
  index: number;
  total: number | null;
}) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-base font-semibold tabular-nums tracking-[-0.01em] text-white sm:text-lg">
        {index}
      </span>
      {total != null ? (
        <span className="hidden text-xs tracking-wide text-[var(--text-muted)] sm:inline">
          {" "}
          of {total}
        </span>
      ) : null}
    </span>
  );
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded ${className}`} aria-hidden />
  );
}

function EpisodesTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DataTable columns={columns} embedded>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <tr
            key={index}
            className="border-b border-white/5 last:border-0"
            style={{
              borderLeft: "2px solid transparent",
              opacity: 1 - index * 0.07,
            }}
          >
            <td className={cellPad}>
              <SkeletonBar className="h-3.5 w-4" />
            </td>
            <td className={cellPad}>
              <div className="flex items-start gap-2 sm:gap-3">
                <SkeletonBar className="h-8 w-11 shrink-0 rounded-md sm:h-10 sm:w-14 sm:rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[75%] max-w-[12rem]" />
                  <SkeletonBar className="h-3 w-[55%] max-w-[9rem]" />
                  <SkeletonBar className="mt-1 h-5 w-16 rounded-full md:hidden" />
                </div>
              </div>
            </td>
            <td className={`${cellPad} ${hideMd}`}>
              <SkeletonBar className="h-3.5 w-20" />
            </td>
            <td className={`${cellPad} ${hideMd}`}>
              <SkeletonBar className="h-5 w-14 rounded-full" />
            </td>
            <td className={cellPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading episodes…</span>
    </div>
  );
}

export default function EpisodesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlChapterId = searchParams.get("chapterId") ?? "";

  const {
    chapters,
    characters,
    locations,
    quizInstructions,
    items,
    pagination,
    totalCount,
    pageRange,
    chapterId,
    setChapterId,
    searchInput,
    setSearchInput,
    clearSearch,
    hasActiveFilters,
    page,
    setPage,
    isPaginated,
    loading,
    saving,
    error,
    editingItem,
    isEditing,
    creating,
    confirmDeleteId,
    startCreate,
    startEdit,
    closeEditor,
    createEpisode,
    updateEpisode,
    deleteEpisode,
    askDelete,
    cancelDelete,
  } = useEpisodes(urlChapterId);

  const chapterOptions = [...chapters]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((chapter) => ({
      value: chapter.id,
      label: chapter.title,
      accentColor: chapter.accentColor,
    }));

  const characterOptions = characters.map((character) => ({
    value: character.id,
    label: character.name,
  }));

  const locationOptions = locations.map((location) => ({
    value: location.id,
    label: location.name,
  }));

  const quizInstructionOptions = quizInstructions.map((instruction) => ({
    value: instruction.id,
    label: instruction.instruction,
  }));

  const chapterFilterOptions = [
    { value: "", label: "All chapters" },
    ...[...chapters]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((chapter) => ({
        value: chapter.id,
        label: chapter.title,
        accentColor: chapter.accentColor,
      })),
  ];

  const activeFilterChapterId = chapterId || undefined;

  const paginationSummary =
    isPaginated && pageRange
      ? `Showing ${pageRange.from}–${pageRange.to} of ${totalCount}`
      : undefined;

  async function handleSave(
    payload: CreateEpisodeInput | UpdateEpisodeInput,
    existing: Episode | null
  ) {
    if (existing) {
      await updateEpisode(existing.id, payload as UpdateEpisodeInput);
    } else {
      await createEpisode(payload as CreateEpisodeInput);
    }
  }

  if (isEditing) {
    const episode = editingItem;
    return (
      <EditView
        title={creating ? "Add Episode" : episode?.title ?? "Episode"}
        subtitle={creating ? "Create a new episode" : "Edit Episode"}
        onBack={closeEditor}
      >
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <EpisodeForm
          episode={episode}
          chapterOptions={chapterOptions}
          characterOptions={characterOptions}
          locationOptions={locationOptions}
          quizInstructionOptions={quizInstructionOptions}
          saving={saving}
          creating={creating}
          defaultDisplayOrder={
            items.length > 0
              ? Math.max(...items.map((item) => item.orderIndex)) + 2
              : 1
          }
          onSave={(payload) => handleSave(payload, episode)}
          onCancel={closeEditor}
        />
      </EditView>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Episode Management"
        subtitle={
          loading
            ? "Loading episodes…"
            : `${pluralize(totalCount, "episode")} in library`
        }
        actionLabel="Add Episode"
        onAction={startCreate}
        actionDisabled={loading}
      />

      <EpisodeFiltersBar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={clearSearch}
        chapterId={chapterId}
        onChapterChange={setChapterId}
        chapterOptions={chapterFilterOptions}
        disabled={loading}
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <EpisodesTableSkeleton />
      ) : items.length === 0 ? (
        <ListState
          message="No episodes found"
          hint={
            hasActiveFilters
              ? "Try adjusting your search or chapter filter."
              : "Create your first episode to get started."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <DataTable columns={columns} embedded>
            {items.map((episode) => {
              const chapterColor = resolveEpisodeChapterAccentColor(
                episode,
                chapters,
                activeFilterChapterId
              );
              const chapterEpisodeCount = resolveEpisodeChapterEpisodeCount(
                episode,
                chapters,
                activeFilterChapterId,
                items
              );
              const episodeIndex = episode.orderIndex + 1;
              const chapterTitle = resolveEpisodeChapterTitle(
                episode,
                chapters,
                activeFilterChapterId
              );

              return (
                <tr
                  key={episode.id}
                  className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
                  style={{
                    borderLeft: `2px solid ${chapterColor}`,
                  }}
                >
                  <td className={`${cellPad} align-top`}>
                    <EpisodeIndexLabel
                      index={episodeIndex}
                      total={chapterEpisodeCount}
                    />
                  </td>
                  <td className={`${cellPad} overflow-hidden align-top`}>
                    <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                      <EpisodeThumb
                        title={episode.title}
                        thumbnailUrl={episode.thumbnailUrl}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.9375rem] font-semibold capitalize tracking-[-0.01em] text-white sm:text-base">
                          {episode.title}
                        </p>
                        <p className="truncate text-[11px] text-[var(--text-muted)] sm:text-xs">
                          {episode.description ?? "No description"}
                        </p>
                        {episode.moralOfTheStory ? (
                          <p className="mt-0.5 truncate text-[11px] italic text-[var(--text-muted)] sm:mt-1 sm:text-xs">
                            Moral: {episode.moralOfTheStory}
                          </p>
                        ) : null}
                        <div className="hidden sm:block">
                          <EpisodeEntityDetails
                            episode={episode}
                            characters={characters}
                            locations={locations}
                            quizInstructions={quizInstructions}
                          />
                        </div>
                        {/* Mobile-only meta: replaces Chapter / Status cols */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden">
                          <PublishBadge
                            published={episode.isPublished ?? false}
                          />
                          <span className="truncate text-[11px] text-[var(--text-muted)]">
                            {chapterTitle}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`${cellPad} ${hideMd} overflow-hidden align-top text-[var(--text-muted)]`}
                  >
                    <p className="truncate">{chapterTitle}</p>
                  </td>
                  <td className={`${cellPad} ${hideMd} align-top`}>
                    <PublishBadge published={episode.isPublished ?? false} />
                  </td>
                  <td className={`${cellPad} align-top`}>
                    <RowActions
                      confirming={confirmDeleteId === episode.id}
                      onQuizzes={() => {
                        const episodeChapterId =
                          episode.chapterId ??
                          episode.chapter?.id ??
                          chapterId;
                        const params = new URLSearchParams({
                          chapterId: episodeChapterId,
                          episodeId: episode.id,
                        });
                        router.push(`/dashboard/quizzes?${params.toString()}`);
                      }}
                      onEdit={() => startEdit(episode.id)}
                      onAskDelete={() => askDelete(episode.id)}
                      onCancelDelete={cancelDelete}
                      onConfirmDelete={() => void deleteEpisode(episode.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </DataTable>

          {isPaginated && pagination && (
            <Pagination
              pagination={pagination}
              page={page}
              onPageChange={setPage}
              loading={loading}
              summary={paginationSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
