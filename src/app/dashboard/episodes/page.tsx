"use client";

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

export default function EpisodesPage() {
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
  } = useEpisodes();

  const chapterOptions = [...chapters]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((chapter) => ({ value: chapter.id, label: chapter.title }));

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
    ...chapterOptions,
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
        title={creating ? "Add Episode" : "Edit Episode"}
        subtitle={
          creating
            ? "Create a new episode"
            : `Editing ${episode?.title ?? "episode"}`
        }
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

              return (
                <tr
                  key={episode.id}
                  className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3.5 align-top text-[var(--text-muted)]">
                    {episode.orderIndex + 1}
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="mt-1 h-9 w-0.5 shrink-0 rounded-full opacity-90"
                        style={{ backgroundColor: chapterColor }}
                        aria-hidden
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
                      onEdit={() => void startEdit(episode.id)}
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
