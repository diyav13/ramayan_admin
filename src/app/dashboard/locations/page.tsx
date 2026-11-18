"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, columnHideClass } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { InfoEntityTable } from "@/components/information/InfoEntityTable";
import { InfoFiltersBar } from "@/components/information/InfoFiltersBar";
import { LocationForm } from "@/components/information/LocationForm";
import { ListState } from "@/components/ListState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { useChapters } from "@/hooks/useChapters";
import { useLocations } from "@/hooks/useLocations";
import { getErrorMessage } from "@/lib/api/errors";
import {
  loadCharactersCatalog,
  loadEventsCatalog,
} from "@/lib/catalog/options";
import { pluralize } from "@/lib/utils";
import type { Character } from "@/types/character";
import type { Event } from "@/types/event";
import type {
  CreateLocationInput,
  UpdateLocationInput,
} from "@/types/location";

const SKELETON_ROWS = 6;
const hideMd = columnHideClass("md");
const cellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";

const entityColumns = [
  { label: "Name" },
  { label: "Description", hideBelow: "md" as const, width: "42%" },
  { label: "Actions", align: "right" as const, width: "6.5rem" },
];

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded ${className}`} aria-hidden />
  );
}

function LocationsTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DataTable columns={entityColumns} embedded>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <tr
            key={index}
            className="border-b border-white/5 last:border-0"
            style={{ opacity: 1 - index * 0.07 }}
          >
            <td className={cellPad}>
              <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                <SkeletonBar className="h-8 w-11 shrink-0 rounded-md sm:h-10 sm:w-14 sm:rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[70%] max-w-[12rem]" />
                  <SkeletonBar className="h-3 w-[55%] max-w-[9rem]" />
                  <SkeletonBar className="mt-1 h-3 w-[80%] max-w-[14rem] md:hidden" />
                </div>
              </div>
            </td>
            <td className={`${cellPad} ${hideMd}`}>
              <div className="space-y-1.5">
                <SkeletonBar className="h-3.5 w-[90%] max-w-[16rem]" />
                <SkeletonBar className="h-3 w-[60%] max-w-[10rem]" />
              </div>
            </td>
            <td className={cellPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading locations…</span>
    </div>
  );
}

export default function LocationsPage() {
  const locations = useLocations();
  const { items: chapters } = useChapters();
  const [characterCatalog, setCharacterCatalog] = useState<Character[]>([]);
  const [eventCatalog, setEventCatalog] = useState<Event[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!locations.isEditing) return;

    let cancelled = false;

    async function loadCatalogs() {
      setCatalogError(null);
      try {
        const [characterData, eventData] = await Promise.all([
          loadCharactersCatalog(),
          loadEventsCatalog(),
        ]);
        if (cancelled) return;
        setCharacterCatalog(characterData);
        setEventCatalog(eventData);
      } catch (err) {
        if (cancelled) return;
        setCatalogError(
          getErrorMessage(err, "Failed to load characters and events")
        );
      }
    }

    void loadCatalogs();
    return () => {
      cancelled = true;
    };
  }, [locations.isEditing]);

  const characterOptions = useMemo(
    () =>
      characterCatalog.map((character) => ({
        value: character.id,
        label: character.title
          ? `${character.name} — ${character.title}`
          : character.name,
      })),
    [characterCatalog]
  );

  const eventOptions = useMemo(
    () =>
      eventCatalog.map((event) => ({
        value: event.id,
        label: event.location?.name
          ? `${event.name} · ${event.location.name}`
          : event.name,
      })),
    [eventCatalog]
  );

  if (locations.isEditing) {
    const entity = locations.editingItem;

    return (
      <EditView
        title={
          locations.creating ? "Add Location" : entity?.name ?? "Location"
        }
        subtitle={
          locations.creating
            ? "Basics first, then connections — then Save"
            : "Update place basics or linked characters and events"
        }
        onBack={locations.closeEditor}
      >
        {(locations.error || catalogError) && (
          <p className="mb-4 text-sm text-red-400">
            {locations.error ?? catalogError}
          </p>
        )}
        <LocationForm
          location={entity}
          chapterOptions={chapterOptions}
          characterOptions={characterOptions}
          eventOptions={eventOptions}
          saving={locations.saving}
          creating={locations.creating}
          onSave={async (payload) => {
            if (entity) {
              await locations.updateLocation(
                entity.id,
                payload as UpdateLocationInput
              );
            } else {
              await locations.createLocation(payload as CreateLocationInput);
            }
          }}
          onCancel={locations.closeEditor}
        />
      </EditView>
    );
  }

  const showSkeleton = locations.initialLoading;
  const subtitle = showSkeleton
    ? "Loading locations…"
    : `${pluralize(locations.totalCount, "location")} total`;

  const paginationSummary = locations.pageRange
    ? `Showing ${locations.pageRange.from}–${locations.pageRange.to} of ${locations.totalCount}`
    : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Locations"
        subtitle={subtitle}
        actionLabel="Add Location"
        onAction={locations.startCreate}
        actionDisabled={showSkeleton}
      />

      <InfoFiltersBar
        search={locations.searchInput}
        onSearchChange={locations.setSearchInput}
        onSearchClear={locations.clearSearch}
        placeholder="Search by name, description, chapter…"
        loading={locations.isSearching}
      />

      {locations.error && <ErrorBanner message={locations.error} />}

      {showSkeleton ? (
        <LocationsTableSkeleton />
      ) : locations.items.length === 0 ? (
        <ListState
          message="No locations found"
          hint={
            locations.hasActiveFilters
              ? "Try adjusting your search."
              : "Create your first location to get started."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <InfoEntityTable
            items={locations.items}
            imageVariant="landscape"
            confirmDeleteId={locations.confirmDeleteId}
            onEdit={(id) => locations.startEdit(id)}
            onAskDelete={locations.askDelete}
            onCancelDelete={locations.cancelDelete}
            onConfirmDelete={(id) => {
              void locations.deleteLocation(id);
            }}
            embedded
          />

          {locations.pagination && (
            <Pagination
              pagination={locations.pagination}
              page={locations.page}
              onPageChange={locations.setPage}
              loading={locations.loading}
              summary={paginationSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
