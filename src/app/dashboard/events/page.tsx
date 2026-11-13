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
import { useEvents } from "@/hooks/useEvents";
import { getErrorMessage } from "@/lib/api/errors";
import { pluralize } from "@/lib/utils";
import { characterService } from "@/services/characters";
import { locationService } from "@/services/locations";
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
              <SkeletonBar className="h-3.5 w-16" />
            </td>
            <td className={`${eventCellPad} ${eventHideLg}`}>
              <SkeletonBar className="h-3.5 w-28" />
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
    hasActiveFilters,
    page,
    setPage,
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
    createEvent,
    updateEvent,
    deleteEvent,
    askDelete,
    cancelDelete,
  } = useEvents();

  const [locations, setLocations] = useState<Location[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogs() {
      try {
        const [locationResult, characterResult] = await Promise.all([
          locationService.list({ page: 1, limit: 100 }),
          characterService.list({ page: 1, limit: 100 }),
        ]);

        if (cancelled) return;

        setLocations(locationResult.data);
        setCharacters(characterResult.data);
        setCatalogError(null);
      } catch (err) {
        if (cancelled) return;
        setCatalogError(
          getErrorMessage(err, "Failed to load locations or characters")
        );
      }
    }

    void loadCatalogs();
    return () => {
      cancelled = true;
    };
  }, []);

  const locationOptions = useMemo(
    () =>
      [...locations]
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        )
        .map((location) => ({
          value: location.id,
          label: location.name,
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
            ? "Image, HTML story, one location, and the people involved"
            : "Update image, HTML story, location, or people"
        }
        onBack={closeEditor}
      >
        {(error || catalogError) && (
          <p className="mb-4 text-sm text-red-400">{error ?? catalogError}</p>
        )}
        <EventForm
          event={event}
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

  const subtitle = loading
    ? "Loading events…"
    : `${pluralize(totalCount, "event")} total`;

  const paginationSummary = pageRange
    ? `Showing ${pageRange.from}–${pageRange.to} of ${totalCount}`
    : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Event Management"
        subtitle={subtitle}
        actionLabel="Add Event"
        onAction={startCreate}
        actionDisabled={loading}
      />

      <EventFiltersBar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={clearSearch}
        locationId={locationFilter}
        onLocationChange={setLocationFilter}
        locationOptions={locationOptions}
        disabled={loading}
      />

      {(error || catalogError) && (
        <ErrorBanner message={error ?? catalogError ?? ""} />
      )}

      {loading ? (
        <EventsTableSkeleton />
      ) : items.length === 0 ? (
        <ListState
          message="No events found"
          hint={
            hasActiveFilters
              ? "Try adjusting your search or location filter."
              : "Create your first key event for the Explore timeline."
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
