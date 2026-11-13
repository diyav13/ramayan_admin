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
import { DataTable, columnHideClass } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListState } from "@/components/ListState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { InfoEntityForm } from "@/components/information/InfoEntityForm";
import {
  InfoEntityTabs,
  type InformationTab,
} from "@/components/information/InfoEntityTabs";
import { InfoEntityTable } from "@/components/information/InfoEntityTable";
import { InfoFiltersBar } from "@/components/information/InfoFiltersBar";
import { QuizInstructionForm } from "@/components/information/QuizInstructionForm";
import { QuizInstructionTable } from "@/components/information/QuizInstructionTable";
import { useCharacters } from "@/hooks/useCharacters";
import { useLocations } from "@/hooks/useLocations";
import { useQuizInstructions } from "@/hooks/useQuizInstructions";
import { getErrorMessage } from "@/lib/api/errors";
import { pluralize } from "@/lib/utils";
import { eventService } from "@/services/events";
import { locationService } from "@/services/locations";
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";
import type { Event } from "@/types/event";
import type {
  CreateLocationInput,
  Location,
  UpdateLocationInput,
} from "@/types/location";

const TAB_META: Record<
  InformationTab,
  {
    singular: string;
    plural: string;
    actionLabel: string;
    searchPlaceholder: string;
  }
> = {
  characters: {
    singular: "character",
    plural: "characters",
    actionLabel: "Add Character",
    searchPlaceholder: "Search characters…",
  },
  locations: {
    singular: "location",
    plural: "locations",
    actionLabel: "Add Location",
    searchPlaceholder: "Search locations…",
  },
  quizInstructions: {
    singular: "quiz instruction",
    plural: "quiz instructions",
    actionLabel: "Add Quiz Instruction",
    searchPlaceholder: "Search instructions…",
  },
};

const SKELETON_ROWS = 6;
const hideMd = columnHideClass("md");
const cellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";

const entityColumns = [
  { label: "Name" },
  { label: "Description", hideBelow: "md" as const, width: "42%" },
  { label: "Actions", align: "right" as const, width: "6.5rem" },
];

const instructionColumns = [
  { label: "Instruction" },
  { label: "Actions", align: "right" as const, width: "6.5rem" },
];

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

function InformationTableSkeleton({
  tab,
  plural,
}: {
  tab: InformationTab;
  plural: string;
}) {
  if (tab === "characters") {
    return <CharactersTableSkeleton />;
  }

  const isInstruction = tab === "quizInstructions";

  return (
    <div
      className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DataTable
        columns={isInstruction ? instructionColumns : entityColumns}
        embedded
      >
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <tr
            key={index}
            className="border-b border-white/5 last:border-0"
            style={{ opacity: 1 - index * 0.07 }}
          >
            <td className={cellPad}>
              <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                <SkeletonBar
                  className={
                    isInstruction
                      ? "h-8 w-11 shrink-0 rounded-md sm:h-10 sm:w-14 sm:rounded-lg"
                      : "h-8 w-11 shrink-0 rounded-md sm:h-10 sm:w-14 sm:rounded-lg"
                  }
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[70%] max-w-[12rem]" />
                  <SkeletonBar className="h-3 w-[55%] max-w-[9rem]" />
                  {!isInstruction ? (
                    <SkeletonBar className="mt-1 h-3 w-[80%] max-w-[14rem] md:hidden" />
                  ) : null}
                </div>
              </div>
            </td>
            {!isInstruction ? (
              <td className={`${cellPad} ${hideMd}`}>
                <div className="space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[90%] max-w-[16rem]" />
                  <SkeletonBar className="h-3 w-[60%] max-w-[10rem]" />
                </div>
              </td>
            ) : null}
            <td className={cellPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading {plural}…</span>
    </div>
  );
}

export default function InformationPage() {
  const [tab, setTab] = useState<InformationTab>("characters");
  const characters = useCharacters(tab === "characters");
  const locations = useLocations(tab === "locations");
  const quizInstructions = useQuizInstructions(tab === "quizInstructions");

  const [locationCatalog, setLocationCatalog] = useState<Location[]>([]);
  const [eventCatalog, setEventCatalog] = useState<Event[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "characters" || !characters.isEditing) return;

    let cancelled = false;

    async function loadCatalogs() {
      setCatalogError(null);
      try {
        const [locationResult, eventResult] = await Promise.all([
          locationService.list({ page: 1, limit: 100 }),
          eventService.list({ page: 1, limit: 100 }),
        ]);
        if (cancelled) return;
        setLocationCatalog(locationResult.data);
        setEventCatalog(eventResult.data);
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
  }, [tab, characters.isEditing]);

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
      })),
    [eventCatalog]
  );

  const active =
    tab === "characters"
      ? characters
      : tab === "locations"
        ? locations
        : quizInstructions;
  const meta = TAB_META[tab];

  if (active.isEditing) {
    if (tab === "quizInstructions") {
      const entity = quizInstructions.editingItem;
      return (
        <EditView
          title={
            quizInstructions.creating
              ? "Add Quiz Instruction"
              : "Edit Quiz Instruction"
          }
          subtitle={
            quizInstructions.creating
              ? "Create a new quiz instruction"
              : "Update instruction text or image"
          }
          onBack={quizInstructions.closeEditor}
        >
          {quizInstructions.error && (
            <p className="mb-4 text-sm text-red-400">
              {quizInstructions.error}
            </p>
          )}
          <QuizInstructionForm
            entity={entity}
            saving={quizInstructions.saving}
            creating={quizInstructions.creating}
            onSave={async (payload) => {
              if (entity) {
                await quizInstructions.updateQuizInstruction(
                  entity.id,
                  payload
                );
              } else {
                await quizInstructions.createQuizInstruction({
                  instruction: payload.instruction ?? "",
                  imageUrl: payload.imageUrl,
                });
              }
            }}
            onCancel={quizInstructions.closeEditor}
          />
        </EditView>
      );
    }

    if (tab === "characters") {
      const entity = characters.editingItem as Character | null;

      return (
        <EditView
          title={
            characters.creating
              ? "Add Character"
              : entity?.name ?? "Character"
          }
          subtitle={
            characters.creating
              ? "Powers Dive Deeper and Explore character screens"
              : "Edit Dive Deeper + Explore character fields"
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
                await characters.createCharacter(
                  payload as CreateCharacterInput
                );
              }
            }}
            onCancel={characters.closeEditor}
          />
        </EditView>
      );
    }

    const entity = locations.editingItem as
      | {
          id: string;
          name: string;
          imageUrl: string | null;
          description: string | null;
        }
      | null;

    return (
      <EditView
        title={
          locations.creating
            ? "Add Location"
            : entity?.name ?? "Location"
        }
        subtitle={
          locations.creating
            ? "Create a new location"
            : "Edit Location"
        }
        onBack={locations.closeEditor}
      >
        {locations.error && (
          <p className="mb-4 text-sm text-red-400">{locations.error}</p>
        )}
        <InfoEntityForm
          entity={entity}
          entityLabel="Location"
          saving={locations.saving}
          creating={locations.creating}
          imageVariant="landscape"
          imageUploadType="location"
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

  const subtitle = active.loading
    ? `Loading ${meta.plural}…`
    : `${pluralize(active.totalCount, meta.singular)} total`;

  const paginationSummary = active.pageRange
    ? `Showing ${active.pageRange.from}–${active.pageRange.to} of ${active.totalCount}`
    : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Information Management"
        subtitle={subtitle}
        actionLabel={meta.actionLabel}
        onAction={active.startCreate}
        actionDisabled={active.loading}
      />

      <InfoEntityTabs
        active={tab}
        onChange={setTab}
        disabled={active.loading}
      />

      <InfoFiltersBar
        search={active.searchInput}
        onSearchChange={active.setSearchInput}
        onSearchClear={active.clearSearch}
        placeholder={meta.searchPlaceholder}
        disabled={active.loading}
      />

      {active.error && <ErrorBanner message={active.error} />}

      {active.loading ? (
        <InformationTableSkeleton tab={tab} plural={meta.plural} />
      ) : active.items.length === 0 ? (
        <ListState
          message={`No ${meta.plural} found`}
          hint={
            active.hasActiveFilters
              ? "Try adjusting your search."
              : `Create your first ${meta.singular} to get started.`
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          {tab === "quizInstructions" ? (
            <QuizInstructionTable
              items={quizInstructions.items}
              confirmDeleteId={quizInstructions.confirmDeleteId}
              onEdit={(id) => quizInstructions.startEdit(id)}
              onAskDelete={quizInstructions.askDelete}
              onCancelDelete={quizInstructions.cancelDelete}
              onConfirmDelete={(id) => {
                void quizInstructions.deleteQuizInstruction(id);
              }}
              embedded
            />
          ) : tab === "characters" ? (
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
          ) : (
            <InfoEntityTable
              items={
                locations.items as Array<{
                  id: string;
                  name: string;
                  imageUrl: string | null;
                  description: string | null;
                  updatedAt: string;
                }>
              }
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
          )}

          {active.pagination && (
            <Pagination
              pagination={active.pagination}
              page={active.page}
              onPageChange={active.setPage}
              loading={active.loading}
              summary={paginationSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
