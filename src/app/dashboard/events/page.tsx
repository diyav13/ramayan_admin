"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { EventFiltersBar } from "@/components/events/EventFiltersBar";
import { EventForm } from "@/components/events/EventForm";
import {
  EventTable,
  eventActionsPad,
  eventCellPad,
  eventColumns,
  eventHideLg,
  eventHideMd,
} from "@/components/events/EventTable";
import { ListState } from "@/components/ListState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { useChapters } from "@/hooks/useChapters";
import { useEvents } from "@/hooks/useEvents";
import { getErrorMessage } from "@/lib/api/errors";
import {
  loadCharactersCatalog,
  loadLocationsCatalog,
} from "@/lib/catalog/options";
import { pluralize } from "@/lib/utils";
import type {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from "@/types/event";
import type { Character } from "@/types/character";
import type { Location } from "@/types/location";

const SKELETON_ROWS = 6;

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded ${className}`} aria-hidden />
  );
}

function EventsTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DataTable columns={eventColumns} embedded>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <tr
            key={index}
            className="border-b border-white/5 last:border-0"
            style={{ opacity: 1 - index * 0.07 }}
          >
            <td className={eventCellPad}>
              <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                <SkeletonBar className="size-10 shrink-0 rounded-full sm:size-12" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[70%] max-w-[12rem]" />
                  <SkeletonBar className="h-3 w-[55%] max-w-[10rem]" />
                </div>
              </div>
            </td>
            <td className={`${eventCellPad} ${eventHideMd}`}>
              <SkeletonBar className="h-3.5 w-20" />
            </td>
            <td className={`${eventCellPad} ${eventHideLg}`}>
              <SkeletonBar className="h-3.5 w-24" />
            </td>
            <td className={eventActionsPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading events…</span>
    </div>
  );
}

export default function EventsPage() {
  const {
    items,
    pagination,
    totalCount,
    pageRange,
    searchInput,
    setSearchInput,
    clearSearch,
    locationFilter,
    setLocationFilter,
    chapterFilter,
    setChapterFilter,
    hasActiveFilters,
    page,
    setPage,
    loading,
    initialLoading,
    isSearching,
    saving,
    error,
    editingItem,
    isEditing,
    creating,
    confirmDeleteId,
    startCreate,
    startEdit,
    closeEditor,
    createEvent,
    updateEvent,
    deleteEvent,
    askDelete,
    cancelDelete,
  } = useEvents();

  const { items: chapters } = useChapters();
  const [locations, setLocations] = useState<Location[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Locations are needed for list filters; characters only when the form is open.
  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      try {
        const data = await loadLocationsCatalog();
        if (cancelled) return;
        setLocations(data);
        setCatalogError(null);
      } catch (err) {
        if (cancelled) return;
        setCatalogError(getErrorMessage(err, "Failed to load locations"));
      }
    }

    void loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;

    async function loadCharacters() {
      try {
        const data = await loadCharactersCatalog();
        if (cancelled) return;
        setCharacters(data);
        setCatalogError(null);
      } catch (err) {
        if (cancelled) return;
        setCatalogError(getErrorMessage(err, "Failed to load characters"));
      }
    }

    void loadCharacters();
    return () => {
      cancelled = true;
    };
  }, [isEditing]);

  const chapterOptions = useMemo(
    () =>
      [...chapters]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((chapter) => ({
          value: chapter.id,
          label: chapter.title,
          accentColor: chapter.accentColor,
        })),
    [chapters]
  );

  const locationOptions = useMemo(
    () =>
      [...locations]
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        )
        .map((location) => ({
          value: location.id,
          label: location.chapter?.title
            ? `${location.name} · ${location.chapter.title}`
            : location.name,
          chapterId: location.chapterId,
          characterIds:
            location.characterIds ??
            location.characters?.map((character) => character.id) ??
            [],
        })),
    [locations]
  );

  const characterOptions = useMemo(
    () =>
      [...characters]
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        )
        .map((character) => ({
          value: character.id,
          label: character.name,
        })),
    [characters]
  );

  async function handleSave(
    payload: CreateEventInput | UpdateEventInput,
    existing: Event | null
  ) {
    if (existing) {
      await updateEvent(existing.id, payload as UpdateEventInput);
    } else {
      await createEvent(payload as CreateEventInput);
    }
  }

  if (isEditing) {
    const event = editingItem;
    return (
      <EditView
        title={creating ? "Add Event" : event?.name ?? "Event"}
        subtitle={
          creating
            ? "Basics → story → where & who — then Save"
            : "Update basics, story, chapter, location, or people"
        }
        onBack={closeEditor}
      >
        {(error || catalogError) && (
          <p className="mb-4 text-sm text-red-400">{error ?? catalogError}</p>
        )}
        <EventForm
          event={event}
          chapterOptions={chapterOptions}
          locationOptions={locationOptions}
          characterOptions={characterOptions}
          saving={saving}
          creating={creating}
          onSave={(payload) => handleSave(payload, event)}
          onCancel={closeEditor}
        />
      </EditView>
    );
  }

  const showSkeleton = initialLoading;
  const subtitle = showSkeleton
    ? "Loading events…"
    : `${pluralize(totalCount, "event")} total`;

  const paginationSummary = pageRange
    ? `Showing ${pageRange.from}–${pageRange.to} of ${totalCount}`
    : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Events"
        subtitle={subtitle}
        actionLabel="Add Event"
        onAction={startCreate}
        actionDisabled={showSkeleton}
      />

      <p className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-[13px]">
        Each event needs a <span className="text-white/80">chapter</span> and{" "}
        <span className="text-white/80">location</span>. Create those under Chapters
        and Locations first if they are missing.
      </p>

      <EventFiltersBar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={clearSearch}
        chapterId={chapterFilter}
        onChapterChange={setChapterFilter}
        chapterOptions={chapterOptions}
        locationId={locationFilter}
        onLocationChange={setLocationFilter}
        locationOptions={locationOptions}
        loading={isSearching}
      />

      {(error || catalogError) && (
        <ErrorBanner message={error ?? catalogError ?? ""} />
      )}

      {showSkeleton ? (
        <EventsTableSkeleton />
      ) : items.length === 0 ? (
        <ListState
          message="No events found"
          hint={
            hasActiveFilters
              ? "Try adjusting your search or location filter."
              : "Create your first event to get started."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <EventTable
            items={items}
            confirmDeleteId={confirmDeleteId}
            onEdit={startEdit}
            onAskDelete={askDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={(id) => {
              void deleteEvent(id);
            }}
            embedded
          />

          {pagination && (
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
