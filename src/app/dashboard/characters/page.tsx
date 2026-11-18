"use client";

import { useEffect, useMemo, useState } from "react";
import { CharacterForm } from "@/components/characters/CharacterForm";
import {
  CharacterTable,
  characterActionsPad,
  characterCellPad,
  characterColumns,
  characterHideLg,
  characterHideMd,
} from "@/components/characters/CharacterTable";
import { DataTable } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { InfoFiltersBar } from "@/components/information/InfoFiltersBar";
import { ListState } from "@/components/ListState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { useCharacters } from "@/hooks/useCharacters";
import { getErrorMessage } from "@/lib/api/errors";
import {
  loadEventsCatalog,
  loadLocationsCatalog,
} from "@/lib/catalog/options";
import { pluralize } from "@/lib/utils";
import type {
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";
import type { Event } from "@/types/event";
import type { Location } from "@/types/location";

const SKELETON_ROWS = 6;

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded ${className}`} aria-hidden />
  );
}

function CharactersTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DataTable columns={characterColumns} embedded>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <tr
            key={index}
            className="border-b border-white/5 last:border-0"
            style={{ opacity: 1 - index * 0.07 }}
          >
            <td className={characterCellPad}>
              <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                <SkeletonBar className="size-10 shrink-0 rounded-full sm:size-12" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[70%] max-w-[12rem]" />
                  <SkeletonBar className="h-3 w-[55%] max-w-[10rem]" />
                </div>
              </div>
            </td>
            <td className={`${characterCellPad} ${characterHideMd}`}>
              <SkeletonBar className="h-3.5 w-20" />
            </td>
            <td className={`${characterCellPad} ${characterHideLg}`}>
              <SkeletonBar className="h-3.5 w-28" />
            </td>
            <td className={characterActionsPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading characters…</span>
    </div>
  );
}

export default function CharactersPage() {
  const characters = useCharacters();
  const [locationCatalog, setLocationCatalog] = useState<Location[]>([]);
  const [eventCatalog, setEventCatalog] = useState<Event[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    if (!characters.isEditing) return;

    let cancelled = false;

    async function loadCatalogs() {
      setCatalogError(null);
      try {
        const [locationData, eventData] = await Promise.all([
          loadLocationsCatalog(),
          loadEventsCatalog(),
        ]);
        if (cancelled) return;
        setLocationCatalog(locationData);
        setEventCatalog(eventData);
      } catch (err) {
        if (cancelled) return;
        setCatalogError(
          getErrorMessage(err, "Failed to load places and events")
        );
      }
    }

    void loadCatalogs();
    return () => {
      cancelled = true;
    };
  }, [characters.isEditing]);

  const locationOptions = useMemo(
    () =>
      locationCatalog.map((location) => ({
        value: location.id,
        label: location.name,
      })),
    [locationCatalog]
  );

  const eventOptions = useMemo(
    () =>
      eventCatalog.map((event) => ({
        value: event.id,
        label: event.location?.name
          ? `${event.name} · ${event.location.name}`
          : event.name,
        locationId: event.locationId ?? event.location?.id ?? null,
      })),
    [eventCatalog]
  );

  if (characters.isEditing) {
    const entity = characters.editingItem;

    return (
      <EditView
        title={
          characters.creating ? "Add Character" : entity?.name ?? "Character"
        }
        subtitle={
          characters.creating
            ? "Step through identity, story, and links — then Save"
            : "Update identity, story, or linked places and events"
        }
        onBack={characters.closeEditor}
      >
        {(characters.error || catalogError) && (
          <p className="mb-4 text-sm text-red-400">
            {characters.error ?? catalogError}
          </p>
        )}
        <CharacterForm
          character={entity}
          locationOptions={locationOptions}
          eventOptions={eventOptions}
          saving={characters.saving}
          creating={characters.creating}
          onSave={async (payload) => {
            if (entity) {
              await characters.updateCharacter(
                entity.id,
                payload as UpdateCharacterInput
              );
            } else {
              await characters.createCharacter(payload as CreateCharacterInput);
            }
          }}
          onCancel={characters.closeEditor}
        />
      </EditView>
    );
  }

  const showSkeleton = characters.initialLoading;
  const subtitle = showSkeleton
    ? "Loading characters…"
    : `${pluralize(characters.totalCount, "character")} total`;

  const paginationSummary = characters.pageRange
    ? `Showing ${characters.pageRange.from}–${characters.pageRange.to} of ${characters.totalCount}`
    : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Characters"
        subtitle={subtitle}
        actionLabel="Add Character"
        onAction={characters.startCreate}
        actionDisabled={showSkeleton}
      />

      <InfoFiltersBar
        search={characters.searchInput}
        onSearchChange={characters.setSearchInput}
        onSearchClear={characters.clearSearch}
        placeholder="Search by name, title, lineage…"
        loading={characters.isSearching}
      />

      {characters.error && <ErrorBanner message={characters.error} />}

      {showSkeleton ? (
        <CharactersTableSkeleton />
      ) : characters.items.length === 0 ? (
        <ListState
          message="No characters found"
          hint={
            characters.hasActiveFilters
              ? "Try adjusting your search."
              : "Create your first character to get started."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <CharacterTable
            items={characters.items}
            confirmDeleteId={characters.confirmDeleteId}
            onEdit={(id) => characters.startEdit(id)}
            onAskDelete={characters.askDelete}
            onCancelDelete={characters.cancelDelete}
            onConfirmDelete={(id) => {
              void characters.deleteCharacter(id);
            }}
            embedded
          />

          {characters.pagination && (
            <Pagination
              pagination={characters.pagination}
              page={characters.page}
              onPageChange={characters.setPage}
              loading={characters.loading}
              summary={paginationSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
