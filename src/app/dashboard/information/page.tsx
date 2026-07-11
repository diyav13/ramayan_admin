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
import { useCharacters } from "@/hooks/useCharacters";
import { useLocations } from "@/hooks/useLocations";
import { pluralize } from "@/lib/utils";
import type {
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";
import type {
  CreateLocationInput,
  UpdateLocationInput,
} from "@/types/location";

export default function InformationPage() {
  const [tab, setTab] = useState<InformationTab>("characters");
  const characters = useCharacters();
  const locations = useLocations();

  const isCharacters = tab === "characters";
  const active = isCharacters ? characters : locations;

  if (active.isEditing) {
    if (isCharacters) {
      const character = characters.editingItem;
      return (
        <EditView
          title={characters.creating ? "Add Character" : "Edit Character"}
          subtitle={
            characters.creating
              ? "Create a new character"
              : `Editing ${character?.name ?? "character"}`
          }
        >
          {characters.error && (
            <p className="mb-4 text-sm text-red-400">{characters.error}</p>
          )}
          <InfoEntityForm
            entity={character}
            entityLabel="Character"
            saving={characters.saving}
            creating={characters.creating}
            imageVariant="portrait"
            onSave={async (payload) => {
              if (character) {
                await characters.updateCharacter(
                  character.id,
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

    const location = locations.editingItem;
    return (
      <EditView
        title={locations.creating ? "Add Location" : "Edit Location"}
        subtitle={
          locations.creating
            ? "Create a new location"
            : `Editing ${location?.name ?? "location"}`
        }
      >
        {locations.error && (
          <p className="mb-4 text-sm text-red-400">{locations.error}</p>
        )}
        <InfoEntityForm
          entity={location}
          entityLabel="Location"
          saving={locations.saving}
          creating={locations.creating}
          imageVariant="landscape"
          onSave={async (payload) => {
            if (location) {
              await locations.updateLocation(
                location.id,
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
    ? `Loading ${isCharacters ? "characters" : "locations"}…`
    : `${pluralize(active.totalCount, isCharacters ? "character" : "location")} total`;

  const paginationSummary = active.pageRange
    ? `Showing ${active.pageRange.from}–${active.pageRange.to} of ${active.totalCount}`
    : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Information Management"
        subtitle={subtitle}
        actionLabel={isCharacters ? "Add Character" : "Add Location"}
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
        placeholder={
          isCharacters ? "Search characters…" : "Search locations…"
        }
      />

      {active.error && <ErrorBanner message={active.error} />}

      {active.loading ? (
        <ListState
          message={`Loading ${isCharacters ? "characters" : "locations"}…`}
        />
      ) : active.items.length === 0 ? (
        <ListState
          message={`No ${isCharacters ? "characters" : "locations"} found`}
          hint={
            active.hasActiveFilters
              ? "Try adjusting your search."
              : `Create your first ${isCharacters ? "character" : "location"} to get started.`
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <InfoEntityTable
            items={active.items}
            imageVariant={isCharacters ? "portrait" : "landscape"}
            confirmDeleteId={active.confirmDeleteId}
            onEdit={(id) => void active.startEdit(id)}
            onAskDelete={active.askDelete}
            onCancelDelete={active.cancelDelete}
            onConfirmDelete={(id) => {
              if (isCharacters) {
                void characters.deleteCharacter(id);
              } else {
                void locations.deleteLocation(id);
              }
            }}
            embedded
          />

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
