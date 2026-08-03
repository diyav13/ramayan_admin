"use client";

import { useState } from "react";
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
import { pluralize } from "@/lib/utils";
import type {
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";
import type {
  CreateLocationInput,
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

export default function InformationPage() {
  const [tab, setTab] = useState<InformationTab>("characters");
  const characters = useCharacters(tab === "characters");
  const locations = useLocations(tab === "locations");
  const quizInstructions = useQuizInstructions(tab === "quizInstructions");

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

    const entity = active.editingItem as
      | { id: string; name: string; imageUrl: string | null; description: string | null }
      | null;
    const entityLabel = tab === "characters" ? "Character" : "Location";

    return (
      <EditView
        title={
          active.creating
            ? `Add ${entityLabel}`
            : entity?.name ?? entityLabel
        }
        subtitle={
          active.creating
            ? `Create a new ${meta.singular}`
            : `Edit ${entityLabel}`
        }
        onBack={active.closeEditor}
      >
        {active.error && (
          <p className="mb-4 text-sm text-red-400">{active.error}</p>
        )}
        <InfoEntityForm
          entity={entity}
          entityLabel={entityLabel}
          saving={active.saving}
          creating={active.creating}
          imageVariant={tab === "characters" ? "portrait" : "landscape"}
          imageUploadType={tab === "characters" ? "character" : "location"}
          onSave={async (payload) => {
            if (tab === "characters") {
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
              return;
            }

            if (entity) {
              await locations.updateLocation(
                entity.id,
                payload as UpdateLocationInput
              );
            } else {
              await locations.createLocation(payload as CreateLocationInput);
            }
          }}
          onCancel={active.closeEditor}
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
    <div className="space-y-5">
      <PageHeader
        title="Information Management"
        subtitle={subtitle}
        actionLabel={meta.actionLabel}
        onAction={active.startCreate}
      />

      <InfoEntityTabs
        active={tab}
        onChange={(next) => {
          setTab(next);
        }}
      />

      <InfoFiltersBar
        search={active.searchInput}
        onSearchChange={active.setSearchInput}
        onSearchClear={active.clearSearch}
        placeholder={meta.searchPlaceholder}
      />

      {active.error && <ErrorBanner message={active.error} />}

      {active.loading ? (
        <ListState message={`Loading ${meta.plural}…`} />
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
          ) : (
            <InfoEntityTable
              items={active.items as Array<{
                id: string;
                name: string;
                imageUrl: string | null;
                description: string | null;
                updatedAt: string;
              }>}
              imageVariant={tab === "characters" ? "portrait" : "landscape"}
              confirmDeleteId={active.confirmDeleteId}
              onEdit={(id) => active.startEdit(id)}
              onAskDelete={active.askDelete}
              onCancelDelete={active.cancelDelete}
              onConfirmDelete={(id) => {
                if (tab === "characters") {
                  void characters.deleteCharacter(id);
                } else {
                  void locations.deleteLocation(id);
                }
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
