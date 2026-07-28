"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable } from "@/components/DataTable";
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
  { label: "#" },
  { label: "Episode" },
  { label: "Chapter" },
  { label: "Status" },
  { label: "Actions", align: "right" as const },
];

const episodeThumbClass =
  "h-10 w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10";

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
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-bold text-[var(--gold)] ${episodeThumbClass}`}
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
      <span className="text-lg font-bold text-white">{index}</span>
      {total != null ? (
        <span className="text-xs text-[var(--text-muted)]"> of {total}</span>
      ) : null}
    </span>
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
    <div className="space-y-5">
      <PageHeader
        title="Episode Management"
        subtitle={
          loading
            ? "Loading episodes…"
            : `${pluralize(totalCount, "episode")} in library`
        }
        actionLabel="Add Episode"
        onAction={startCreate}
      />

      <EpisodeFiltersBar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={clearSearch}
        chapterId={chapterId}
        onChapterChange={setChapterId}
        chapterOptions={chapterFilterOptions}
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ListState message="Loading episodes…" />
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
          <DataTable columns={columns} minWidth={800} embedded>
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

              return (
                <tr
                  key={episode.id}
                  className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
                  style={{
                    borderLeft: `2px solid ${chapterColor}`,
                  }}
                >
                  <td className="px-4 py-3.5 align-top">
                    <EpisodeIndexLabel
                      index={episodeIndex}
                      total={chapterEpisodeCount}
                    />
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <div className="flex min-w-0 items-start gap-3">
                      <EpisodeThumb
                        title={episode.title}
                        thumbnailUrl={episode.thumbnailUrl}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-serif text-[15px] capitalize text-white">
                          {episode.title}
                        </p>
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          {episode.description ?? "No description"}
                        </p>
                        {episode.moralOfTheStory ? (
                          <p className="mt-1 truncate text-xs italic text-[var(--text-muted)]">
                            Moral: {episode.moralOfTheStory}
                          </p>
                        ) : null}
                        <EpisodeEntityDetails
                          episode={episode}
                          characters={characters}
                          locations={locations}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-top text-[var(--text-muted)]">
                    {resolveEpisodeChapterTitle(
                      episode,
                      chapters,
                      activeFilterChapterId
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <PublishBadge published={episode.isPublished ?? false} />
                  </td>
                  <td className="px-4 py-3.5 align-top">
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
