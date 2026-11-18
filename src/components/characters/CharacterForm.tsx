"use client";

import { FormEvent, useMemo, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { InfoImageField } from "@/components/information/InfoImageField";
import { DarkSelectField } from "@/components/ui/DarkSelectField";
import { Field, controlClass } from "@/components/ui/Field";
import { FlowGuide } from "@/components/ui/FlowGuide";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { nullableField, optionalField, readText } from "@/lib/utils";
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";

type SelectOption = { value: string; label: string; locationId?: string | null };

function resolveImageForSave(
  previewUrl: string,
  existingUrl: string | null | undefined
): string | undefined | null {
  if (!previewUrl) {
    return existingUrl ? null : undefined;
  }
  return optionalField(previewUrl);
}

type CharacterFormProps = {
  character: Character | null;
  locationOptions: SelectOption[];
  eventOptions: SelectOption[];
  saving: boolean;
  creating: boolean;
  onSave: (payload: CreateCharacterInput | UpdateCharacterInput) => Promise<void>;
  onCancel: () => void;
};

export function CharacterForm({
  character,
  locationOptions,
  eventOptions,
  saving,
  creating,
  onSave,
  onCancel,
}: CharacterFormProps) {
  const [imageUrl, setImageUrl] = useState(character?.imageUrl ?? "");
  const [imageUploading, setImageUploading] = useState(false);
  const [locationIds, setLocationIds] = useState<string[]>(
    character?.locationIds ?? character?.locations?.map((l) => l.id) ?? []
  );
  const [keyEventId, setKeyEventId] = useState(character?.keyEventId ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const linkedEventLabels =
    character?.events?.map((event) =>
      event.location?.name
        ? `${event.name} · ${event.location.name}`
        : event.name
    ) ??
    (character?.eventIds ?? [])
      .map((id) => eventOptions.find((option) => option.value === id)?.label)
      .filter((label): label is string => Boolean(label));

  /** Prefer events at the character’s selected places; keep current key event visible. */
  const filteredKeyEventOptions = useMemo(() => {
    if (locationIds.length === 0) return eventOptions;
    const placeSet = new Set(locationIds);
    const matching = eventOptions.filter(
      (option) =>
        !option.locationId ||
        placeSet.has(option.locationId) ||
        option.value === keyEventId
    );
    return matching.length > 0 ? matching : eventOptions;
  }, [eventOptions, keyEventId, locationIds]);

  function handleLocationIdsChange(next: string[]) {
    setLocationIds(next);
    if (!keyEventId || next.length === 0) return;
    const selected = eventOptions.find((option) => option.value === keyEventId);
    if (
      selected?.locationId &&
      !next.includes(selected.locationId)
    ) {
      setKeyEventId("");
    }
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setFormError(null);

    const form = new FormData(formEvent.currentTarget);
    const name = readText(form, "name").trim();
    const title = readText(form, "title").trim();
    const lineage = readText(form, "lineage").trim();
    const description = readText(form, "description").trim();
    const relationshipsBlurb = readText(form, "relationshipsBlurb").trim();

    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (!imageUrl.trim()) {
      setFormError("Portrait image is required.");
      return;
    }
    if (!title) {
      setFormError("Title is required.");
      return;
    }
    if (!lineage) {
      setFormError("Lineage is required.");
      return;
    }
    if (!description) {
      setFormError("Biography is required.");
      return;
    }
    if (!relationshipsBlurb) {
      setFormError("Relationships summary is required.");
      return;
    }

    const base: CreateCharacterInput = {
      name,
      title,
      lineage,
      description,
      relationshipsBlurb,
      imageUrl: resolveImageForSave(imageUrl, character?.imageUrl),
      // Character / place links stay optional.
      locationIds: locationIds.filter((id) => id.trim().length > 0),
      keyEventId: optionalField(keyEventId) ?? null,
    };

    const payload: CreateCharacterInput | UpdateCharacterInput = creating
      ? base
      : {
          ...base,
          title: nullableField(title),
          lineage: nullableField(lineage),
          description: nullableField(description),
          relationshipsBlurb: nullableField(relationshipsBlurb),
          keyEventId: nullableField(keyEventId),
        };

    await onSave(payload);
  }

  const keyEventOptions: SelectOption[] = [
    { value: "", label: "None" },
    ...filteredKeyEventOptions,
  ];

  return (
    <form
      onSubmit={(formEvent) => void handleSubmit(formEvent)}
      className="space-y-5"
    >
      <FlowGuide
        title="Character setup"
        steps={[
          "Add identity details (name, portrait, title, lineage).",
          "Write the biography and relationships summary.",
          "Optionally link places and a key event, then Save.",
        ]}
        footer="Linked events below are read-only — add this character on an Event form. Place and key-event links are optional."
      />

      {formError ? (
        <p className="text-sm text-red-400">{formError}</p>
      ) : null}

      <FormSection
        step={1}
        title="Identity"
        description="Who they are — portrait and basic labels. All fields required."
      >
        <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
          <InfoImageField
            label="Portrait *"
            value={imageUrl}
            onChange={setImageUrl}
            variant="portrait"
            uploadType="character"
            entityId={character?.id}
            onUploadingChange={setImageUploading}
          />
          <div className="space-y-4">
            <Input
              label="Name *"
              name="name"
              defaultValue={character?.name}
              required
              placeholder="Enter character name"
            />
            <Field
              label="Title *"
              htmlFor="character-title"
              description="Short role line shown under the name."
            >
              <input
                id="character-title"
                name="title"
                defaultValue={character?.title ?? ""}
                required
                placeholder="Enter short title or role"
                className={`${controlClass} h-14 px-4`}
              />
            </Field>
            <Field
              label="Lineage *"
              htmlFor="character-lineage"
              description="Dynasty, kingdom, or family line."
            >
              <input
                id="character-lineage"
                name="lineage"
                defaultValue={character?.lineage ?? ""}
                required
                placeholder="Enter dynasty, kingdom, or lineage"
                className={`${controlClass} h-14 px-4`}
              />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection
        step={2}
        title="Story"
        description="Longer text shown on the character detail screens. All fields required."
      >
        <Field
          label="Biography *"
          htmlFor="character-description"
          description="Main character biography."
        >
          <textarea
            id="character-description"
            name="description"
            rows={5}
            defaultValue={character?.description ?? ""}
            required
            placeholder="Enter character biography"
            className={`${controlClass} resize-none px-4 py-3`}
          />
        </Field>

        <Field
          label="Relationships *"
          htmlFor="character-relationships"
          description="Short intro under Relationships. The relationship graph is managed separately."
        >
          <textarea
            id="character-relationships"
            name="relationshipsBlurb"
            rows={2}
            defaultValue={character?.relationshipsBlurb ?? ""}
            required
            placeholder="Enter a short relationships summary"
            className={`${controlClass} resize-none px-4 py-3`}
          />
        </Field>
      </FormSection>

      <FormSection
        step={3}
        title="Links"
        description="Optional — places in their journey and a key event."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <MultiSelect
            label="Places in their journey (optional)"
            options={locationOptions}
            value={locationIds}
            onChange={handleLocationIdsChange}
            placeholder="Choose places"
            searchPlaceholder="Search locations…"
            emptyMessage="No locations available"
            hint="Optional. Multiple places allowed. Key-event list filters to these places."
          />
          <DarkSelectField
            label="Key event (optional)"
            name="keyEventId"
            options={keyEventOptions}
            value={keyEventId}
            onChange={setKeyEventId}
            placeholder={
              locationIds.length > 0
                ? "Choose a key event at these places"
                : "Optional — choose places first to filter"
            }
          />
        </div>

        <Field
          label="Linked events"
          htmlFor="character-linked-events"
          description="Events that include this character (set on the Event form)."
        >
          {linkedEventLabels.length > 0 ? (
            <ul
              id="character-linked-events"
              className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-[var(--surface-alt)]/60 px-3 py-3"
            >
              {linkedEventLabels.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/90"
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <p
              id="character-linked-events"
              className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-sm text-[var(--text-muted)]"
            >
              No events linked yet. Add this character under “People in this event”
              on an Event.
            </p>
          )}
        </Field>
      </FormSection>

      <FormActions
        submitLabel={
          saving
            ? "Saving…"
            : creating
              ? "Create Character"
              : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving || imageUploading}
      />
    </form>
  );
}
