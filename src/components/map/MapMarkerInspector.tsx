"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { InfoImageField } from "@/components/information/InfoImageField";
import { Button } from "@/components/ui/Button";
import { DarkSelectField } from "@/components/ui/DarkSelectField";
import { Field, controlClass } from "@/components/ui/Field";
import { HtmlEditor } from "@/components/ui/HtmlEditor";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Textarea } from "@/components/ui/Textarea";
import { clampPercent } from "@/lib/map/placements";
import { isBlankHtml } from "@/lib/utils";
import type { Character } from "@/types/character";
import type { Event as StoryEvent } from "@/types/event";
import type { Location } from "@/types/location";
import type { MapMarker, MapMarkerDraft, MapMarkerKind } from "@/types/map-marker";

function sameIdList(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((id, index) => id === b[index]);
}

function isDraftDirty(draft: MapMarkerDraft, marker: MapMarker): boolean {
  return (
    draft.locationId !== marker.locationId ||
    draft.name !== marker.name ||
    draft.subtitle !== marker.subtitle ||
    draft.description !== marker.description ||
    draft.bodyHtml !== marker.bodyHtml ||
    draft.kind !== marker.kind ||
    draft.imageUrl !== marker.imageUrl ||
    draft.detailImageUrl !== marker.detailImageUrl ||
    !sameIdList(draft.characterIds, marker.characterIds) ||
    !sameIdList(draft.eventIds, marker.eventIds) ||
    clampPercent(draft.xPercent) !== clampPercent(marker.xPercent) ||
    clampPercent(draft.yPercent) !== clampPercent(marker.yPercent)
  );
}

/** Resolve linked character + event ids for a catalog location. */
function linksForLocation(
  locationId: string,
  locations: Location[],
  characters: Character[],
  events: StoryEvent[]
): { characterIds: string[]; eventIds: string[] } {
  const loc = locations.find((item) => item.id === locationId);

  const fromLocationCharacters =
    loc?.characterIds ??
    loc?.characters?.map((character) => character.id) ??
    [];
  const fromLocationEvents =
    loc?.eventIds ?? loc?.events?.map((event) => event.id) ?? [];

  const characterIds =
    fromLocationCharacters.length > 0
      ? fromLocationCharacters
      : characters
          .filter((character) => character.locationIds?.includes(locationId))
          .map((character) => character.id);

  const eventIds =
    fromLocationEvents.length > 0
      ? fromLocationEvents
      : events
          .filter((event) => event.locationId === locationId)
          .map((event) => event.id);

  return { characterIds, eventIds };
}

type MapMarkerInspectorProps = {
  marker: MapMarker | null;
  draft: MapMarkerDraft | null;
  locations: Location[];
  characters: Character[];
  events: StoryEvent[];
  pathIndex: number | null;
  isNew?: boolean;
  onChange: (next: MapMarkerDraft) => void;
  onSave: () => void;
  onRemove: () => void;
  onClearSelection: () => void;
  onAddLocation: () => void;
};

function SectionLabel({
  step,
  children,
  hint,
}: {
  step?: number;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1 pt-1">
      <div className="flex items-center gap-2">
        {typeof step === "number" ? (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[10px] font-semibold text-[var(--gold)]"
            aria-hidden
          >
            {step}
          </span>
        ) : null}
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {children}
        </p>
      </div>
      {hint ? (
        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]/80">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function MapMarkerInspector({
  marker,
  draft,
  locations,
  characters,
  events,
  pathIndex,
  isNew = false,
  onChange,
  onSave,
  onRemove,
  onClearSelection,
  onAddLocation,
}: MapMarkerInspectorProps) {
  const [showFineTune, setShowFineTune] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Only show required-field errors after the user tries to Save. */
  const [attemptedSave, setAttemptedSave] = useState(false);

  // All catalog locations stay available — the same place can be linked on multiple pins.
  const locationOptions = useMemo(
    () => [
      { value: "", label: "None — custom pin" },
      ...locations.map((loc) => ({
        value: loc.id,
        label: loc.chapter?.title
          ? `${loc.name} · ${loc.chapter.title}`
          : loc.name,
      })),
    ],
    [locations]
  );

  // Parent scopes these by linked location (or passes the full catalog).
  const characterOptions = useMemo(
    () =>
      characters.map((character) => ({
        value: character.id,
        label: character.title
          ? `${character.name} — ${character.title}`
          : character.name,
      })),
    [characters]
  );

  const eventOptions = useMemo(
    () =>
      events.map((event) => ({
        value: event.id,
        label: [event.name, event.chapter?.title, event.location?.name]
          .filter(Boolean)
          .join(" · "),
      })),
    [events]
  );

  const hasName = Boolean(draft?.name.trim());
  const hasSubtitle = Boolean(draft?.subtitle.trim());
  const hasDescription = Boolean(draft?.description.trim());
  const hasBodyHtml = !isBlankHtml(draft?.bodyHtml);
  const missingRequired = !hasName
    ? "Name is required."
    : !hasSubtitle
      ? "Subtitle is required."
      : !hasDescription
        ? "Short description is required."
        : !hasBodyHtml
          ? "Role in the story is required."
          : null;
  const validationError = attemptedSave ? missingRequired : null;
  const isDirty = useMemo(() => {
    if (!marker || !draft) return false;
    if (isNew || !marker.saved) return true;
    return isDraftDirty(draft, marker);
  }, [draft, isNew, marker]);
  // Allow Save so validation can run on click; required fields checked in handleSaveClick.
  const canSave = isDirty && !saving;

  useEffect(() => {
    setAttemptedSave(false);
  }, [marker?.id]);

  if (!marker || !draft) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/10 bg-[var(--surface-alt)]/60 px-5 py-8 text-center">
        <div>
          <p className="text-sm font-medium text-white">No pin selected</p>
          <p className="subtitle-text mt-2 text-xs sm:text-sm">
            1) Add a pin on the map → 2) Fill details here → 3) Save. Or select
            an existing pin from the list or map.
          </p>
        </div>
        <Button type="button" size="sm" onClick={onAddLocation}>
          + Add pin
        </Button>
      </div>
    );
  }

  function patch(partial: Partial<MapMarkerDraft>) {
    onChange({ ...draft!, ...partial });
  }

  async function handleSaveClick() {
    if (!canSave) return;
    setAttemptedSave(true);
    if (missingRequired) return;
    setSaving(true);
    try {
      onSave();
      // Local persist is sync; brief feedback so the button loading state is visible.
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      setAttemptedSave(false);
    } finally {
      setSaving(false);
    }
  }

  function handleLocationLink(value: string) {
    if (!value) {
      patch({
        locationId: null,
        characterIds: [],
        eventIds: [],
      });
      return;
    }

    const loc = locations.find((item) => item.id === value);
    const { characterIds, eventIds } = linksForLocation(
      value,
      locations,
      characters,
      events
    );

    patch({
      locationId: value,
      name: loc?.name ?? draft!.name,
      description: loc?.description ?? draft!.description,
      // Detail hero stays on the pin (S3 mapDetail); API falls back to location image.
      // Always sync connections to the selected location (multi allowed).
      characterIds,
      eventIds,
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
      <div className="flex items-start justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--gold)]">
            {isNew ? "New map pin" : "Edit map pin"}
            {pathIndex !== null ? ` · path #${pathIndex + 1}` : ""}
            {isNew ? " · unsaved" : ""}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold tracking-tight">
            {draft.name.trim() || "Untitled pin"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClearSelection}
          className="shrink-0 rounded px-2 py-1 text-xs font-medium text-[var(--text-muted)] transition hover:bg-white/5 hover:text-white"
        >
          {isNew ? "Discard" : "Close"}
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-y-contain px-4 py-4 pb-8 [scrollbar-gutter:stable]">
        <SectionLabel
          step={1}
          hint="Name the pin, set style, and optionally link a catalog Location."
        >
          Pin on map
        </SectionLabel>

        <Input
          id="map-marker-name"
          label="Name *"
          value={draft.name}
          onChange={(event) => patch({ name: event.target.value })}
          placeholder="e.g. Ayodhya"
          required
        />

        <Input
          id="map-marker-subtitle"
          label="Subtitle *"
          value={draft.subtitle}
          onChange={(event) => patch({ subtitle: event.target.value })}
          placeholder="e.g. Capital of Kosala · On the Sarayu"
          required
        />

        <InfoImageField
          label="Pin image"
          value={draft.imageUrl ?? ""}
          onChange={(imageUrl) => patch({ imageUrl: imageUrl || null })}
          variant="portrait"
          uploadType="mapPin"
          entityId={marker?.id}
        />

        <InfoImageField
          label="Detail image"
          value={draft.detailImageUrl ?? ""}
          onChange={(detailImageUrl) =>
            patch({ detailImageUrl: detailImageUrl || null })
          }
          variant="landscape"
          uploadType="mapDetail"
          entityId={marker?.id}
        />

        <Field label="Style" htmlFor="marker-kind">
          <div className="grid grid-cols-2 gap-2" id="marker-kind">
            {(
              [
                ["place", "Landmark"],
                ["journey", "Stop"],
              ] as const
            ).map(([value, label]) => {
              const active = draft.kind === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => patch({ kind: value as MapMarkerKind })}
                  className={`rounded border px-3 py-2 text-xs font-medium tracking-wide transition ${
                    active
                      ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-[var(--gold)]"
                      : "border-white/10 bg-[var(--surface)] text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Field>

        <DarkSelectField
          label="Link catalog location (optional)"
          options={locationOptions}
          value={draft.locationId ?? ""}
          onChange={handleLocationLink}
          placeholder="Optional — fills name, characters & events"
          menuMode="inline"
          searchable
          searchPlaceholder="Search locations…"
        />

        <button
          type="button"
          onClick={() => setShowFineTune((v) => !v)}
          className="text-xs font-medium tracking-wide text-[var(--text-muted)] transition hover:text-white"
        >
          {showFineTune ? "Hide position" : "Fine-tune position"}
        </button>

        {showFineTune ? (
          <div className="space-y-3 rounded-md border border-white/5 bg-black/20 p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="X %" htmlFor="map-x">
                <input
                  id="map-x"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={draft.xPercent}
                  onChange={(event) =>
                    patch({
                      xPercent: clampPercent(Number(event.target.value)),
                    })
                  }
                  className={`${controlClass} h-11 px-3`}
                />
              </Field>
              <Field label="Y %" htmlFor="map-y">
                <input
                  id="map-y"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={draft.yPercent}
                  onChange={(event) =>
                    patch({
                      yPercent: clampPercent(Number(event.target.value)),
                    })
                  }
                  className={`${controlClass} h-11 px-3`}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["←", { xPercent: draft.xPercent - 0.5 }],
                  ["→", { xPercent: draft.xPercent + 0.5 }],
                  ["↑", { yPercent: draft.yPercent - 0.5 }],
                  ["↓", { yPercent: draft.yPercent + 0.5 }],
                ] as const
              ).map(([label, delta]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    patch({
                      xPercent: clampPercent(
                        "xPercent" in delta ? delta.xPercent : draft.xPercent
                      ),
                      yPercent: clampPercent(
                        "yPercent" in delta ? delta.yPercent : draft.yPercent
                      ),
                    })
                  }
                  className="rounded border border-white/10 bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <SectionLabel
          step={2}
          hint="Short text shown when someone taps the pin."
        >
          Preview sheet
        </SectionLabel>

        <Textarea
          id="map-marker-description"
          label="Short description *"
          value={draft.description}
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="Shown under the subtitle on the map preview sheet…"
          rows={3}
          required
        />

        <SectionLabel
          step={3}
          hint="Longer story content for the full place screen."
        >
          Detail screen
        </SectionLabel>

        <HtmlEditor
          label="Role in the story *"
          value={draft.bodyHtml}
          onChange={(bodyHtml) => patch({ bodyHtml })}
          description="Shown under “Role in the story” on the app location detail screen."
          placeholder="Describe this place’s role in the Ramayana…"
          minHeightClass="min-h-[9rem]"
        />

        <SectionLabel
          step={4}
          hint={
            draft.locationId
              ? "Optional. Showing characters and events for the linked location (all if none are linked yet)."
              : "Optional. Showing all characters and events — link a location to narrow the lists."
          }
        >
          Connections
        </SectionLabel>

        <MultiSelect
          label="Characters (optional)"
          options={characterOptions}
          value={draft.characterIds}
          onChange={(characterIds) => patch({ characterIds })}
          placeholder={
            draft.locationId
              ? "Optional — choose characters at this place"
              : "Optional — choose characters"
          }
          searchPlaceholder="Search characters…"
          emptyMessage="No characters loaded"
          hint="Optional. Chips under the preview and on the detail screen."
          menuMode="inline"
        />

        <MultiSelect
          label="Events (optional)"
          options={eventOptions}
          value={draft.eventIds}
          onChange={(eventIds) => patch({ eventIds })}
          placeholder={
            draft.locationId
              ? "Optional — choose events at this place"
              : "Optional — choose events"
          }
          searchPlaceholder="Search events…"
          emptyMessage="No events loaded"
          hint="Optional. Key-event rows on the place detail screen."
          menuMode="inline"
        />
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-white/5 px-4 py-3">
        {validationError ? (
          <p className="text-xs text-red-400">{validationError}</p>
        ) : null}
        <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!canSave}
          onClick={() => void handleSaveClick()}
          className="flex-1"
        >
          {saving ? "Saving…" : isNew ? "Save" : isDirty ? "Save" : "Saved"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={saving}
          onClick={() => {
            const label = draft.name.trim() || "this pin";
            const message = isNew
              ? `Discard “${label}”? It has not been saved yet.`
              : `Remove “${label}” from the map? This cannot be undone.`;
            if (window.confirm(message)) {
              onRemove();
            }
          }}
          className="flex-1"
        >
          Remove
        </Button>
        </div>
      </div>
    </div>
  );
}
