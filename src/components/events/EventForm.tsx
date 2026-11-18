"use client";

import { FormEvent, useMemo, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { ChapterSelectField } from "@/components/chapters/ChapterSelectField";
import { InfoImageField } from "@/components/information/InfoImageField";
import { DarkSelectField } from "@/components/ui/DarkSelectField";
import { FlowGuide } from "@/components/ui/FlowGuide";
import { FormSection } from "@/components/ui/FormSection";
import { HtmlEditor } from "@/components/ui/HtmlEditor";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { isBlankHtml, nullableField, optionalField } from "@/lib/utils";
import type {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from "@/types/event";

type SelectOption = { value: string; label: string };
type ChapterOption = SelectOption & { accentColor?: string | null };
type LocationOption = SelectOption & {
  chapterId?: string | null;
  characterIds?: string[];
};

function resolveImageForSave(
  previewUrl: string,
  existingUrl: string | null | undefined
): string | undefined | null {
  if (!previewUrl) {
    return existingUrl ? null : undefined;
  }
  return optionalField(previewUrl);
}

type EventFormProps = {
  event: Event | null;
  chapterOptions: ChapterOption[];
  locationOptions: LocationOption[];
  characterOptions: SelectOption[];
  saving: boolean;
  creating: boolean;
  onSave: (payload: CreateEventInput | UpdateEventInput) => Promise<void>;
  onCancel: () => void;
};

export function EventForm({
  event,
  chapterOptions,
  locationOptions,
  characterOptions,
  saving,
  creating,
  onSave,
  onCancel,
}: EventFormProps) {
  const [imageUrl, setImageUrl] = useState(event?.imageUrl ?? "");
  const [imageUploading, setImageUploading] = useState(false);
  const [description, setDescription] = useState(event?.description ?? "");
  const [chapterId, setChapterId] = useState(event?.chapterId ?? "");
  const [locationId, setLocationId] = useState(event?.locationId ?? "");
  const [characterIds, setCharacterIds] = useState<string[]>(
    event?.characterIds ?? event?.characters?.map((c) => c.id) ?? []
  );
  const [formError, setFormError] = useState<string | null>(null);

  const filteredLocationOptions = useMemo(() => {
    const noneOption = { value: "", label: "None — no place linked" };
    if (!chapterId) return [noneOption, ...locationOptions];
    const matching = locationOptions.filter(
      (location) => !location.chapterId || location.chapterId === chapterId
    );
    // Keep current selection visible even if it belongs to another chapter.
    if (
      locationId &&
      !matching.some((location) => location.value === locationId)
    ) {
      const current = locationOptions.find(
        (location) => location.value === locationId
      );
      if (current) return [noneOption, current, ...matching];
    }
    return [noneOption, ...matching];
  }, [chapterId, locationId, locationOptions]);

  /** Prefer characters linked to the selected place; keep current picks visible. */
  const filteredCharacterOptions = useMemo(() => {
    if (!locationId) return characterOptions;
    const selected = locationOptions.find(
      (location) => location.value === locationId
    );
    const linked = new Set(selected?.characterIds ?? []);
    if (linked.size === 0) return characterOptions;
    const matching = characterOptions.filter(
      (option) => linked.has(option.value) || characterIds.includes(option.value)
    );
    return matching.length > 0 ? matching : characterOptions;
  }, [characterIds, characterOptions, locationId, locationOptions]);

  function handleChapterChange(value: string) {
    setChapterId(value);
    if (!value || !locationId) return;
    const selected = locationOptions.find(
      (location) => location.value === locationId
    );
    if (selected?.chapterId && selected.chapterId !== value) {
      setLocationId("");
    }
  }

  function handleLocationChange(value: string) {
    setLocationId(value);
    if (!value) return;
    const selected = locationOptions.find(
      (location) => location.value === value
    );
    if (selected?.chapterId) {
      setChapterId(selected.chapterId);
    }
    // Seed people from the place when the event has none yet.
    if (
      characterIds.length === 0 &&
      selected?.characterIds &&
      selected.characterIds.length > 0
    ) {
      setCharacterIds(selected.characterIds);
    }
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setFormError(null);

    const name = String(
      new FormData(formEvent.currentTarget).get("name") ?? ""
    ).trim();

    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (!imageUrl.trim()) {
      setFormError("Event image is required.");
      return;
    }
    if (isBlankHtml(description)) {
      setFormError("Description is required.");
      return;
    }
    if (!chapterId) {
      setFormError("Select a chapter. Events are grouped by chapter.");
      return;
    }

    const descriptionValue = description.trim();

    const base: CreateEventInput = {
      name,
      description: descriptionValue,
      imageUrl: resolveImageForSave(imageUrl, event?.imageUrl),
      chapterId,
      // Location and character selection stay optional.
      locationId: optionalField(locationId) ?? null,
      characterIds: characterIds.filter((id) => id.trim().length > 0),
    };

    const payload: CreateEventInput | UpdateEventInput = creating
      ? base
      : {
          ...base,
          description: nullableField(descriptionValue),
          locationId: nullableField(locationId),
        };

    await onSave(payload);
  }

  return (
    <form
      onSubmit={(formEvent) => void handleSubmit(formEvent)}
      className="space-y-5"
    >
      <FlowGuide
        title="Event setup"
        steps={[
          "Name the event and add an image.",
          "Write the story description.",
          "Pick a chapter, then optionally a location and people, and Save.",
        ]}
        footer="Location and people are optional. If you pick a location, it is used by Locations and Story Map for “events at this place.”"
      />

      {formError ? (
        <p className="text-sm text-red-400">{formError}</p>
      ) : null}

      <FormSection
        step={1}
        title="Basics"
        description="Title image and event name — both required."
      >
        <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
          <InfoImageField
            label="Image *"
            value={imageUrl}
            onChange={setImageUrl}
            variant="landscape"
            uploadType="event"
            entityId={event?.id}
            onUploadingChange={setImageUploading}
          />
          <Input
            label="Name *"
            name="name"
            defaultValue={event?.name}
            required
            placeholder="Enter event name"
          />
        </div>
      </FormSection>

      <FormSection
        step={2}
        title="Story"
        description="What happens and why it matters — required."
      >
        <HtmlEditor
          label="Description *"
          value={description}
          onChange={setDescription}
          disabled={saving}
          description="Include summary, what happens, and why it matters."
          placeholder="Enter the event story…"
        />
      </FormSection>

      <FormSection
        step={3}
        title="Where & who"
        description="Chapter is required. Location and people are optional."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ChapterSelectField
            label="Chapter *"
            name="chapterId"
            options={chapterOptions}
            value={chapterId}
            onChange={handleChapterChange}
            required
            placeholder="Choose a chapter"
          />
          <DarkSelectField
            label="Location (optional)"
            name="locationId"
            options={filteredLocationOptions}
            value={locationId}
            onChange={handleLocationChange}
            placeholder={
              chapterId
                ? "Optional — choose a location"
                : "Select chapter first (optional)"
            }
            disabled={!chapterId}
          />
        </div>

        <MultiSelect
          label="People in this event (optional)"
          options={filteredCharacterOptions}
          value={characterIds}
          onChange={setCharacterIds}
          placeholder={
            locationId
              ? "Optional — choose characters at this place"
              : "Optional — choose characters"
          }
          searchPlaceholder="Search characters…"
          emptyMessage={
            locationId
              ? "No characters linked to this location yet"
              : "No characters available"
          }
          hint="Optional. Multiple people allowed. List prefers characters linked to the selected location."
        />
      </FormSection>

      <FormActions
        submitLabel={
          saving ? "Saving…" : creating ? "Create Event" : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving || imageUploading}
      />
    </form>
  );
}
