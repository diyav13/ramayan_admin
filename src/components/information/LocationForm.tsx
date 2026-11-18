"use client";

import { FormEvent, useMemo, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { ChapterSelectField } from "@/components/chapters/ChapterSelectField";
import { InfoImageField } from "@/components/information/InfoImageField";
import { FlowGuide } from "@/components/ui/FlowGuide";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Textarea } from "@/components/ui/Textarea";
import { nullableField, optionalField, readText } from "@/lib/utils";
import type {
  CreateLocationInput,
  Location,
  UpdateLocationInput,
} from "@/types/location";

type SelectOption = { value: string; label: string };
type ChapterOption = SelectOption & { accentColor?: string | null };

function resolveImageForSave(
  previewUrl: string,
  existingUrl: string | null | undefined
): string | undefined | null {
  if (!previewUrl) {
    return existingUrl ? null : undefined;
  }
  return optionalField(previewUrl);
}

type LocationFormProps = {
  location: Location | null;
  chapterOptions: readonly ChapterOption[];
  characterOptions: SelectOption[];
  eventOptions: SelectOption[];
  saving: boolean;
  creating: boolean;
  onSave: (payload: CreateLocationInput | UpdateLocationInput) => Promise<void>;
  onCancel: () => void;
};

export function LocationForm({
  location,
  chapterOptions,
  characterOptions,
  eventOptions,
  saving,
  creating,
  onSave,
  onCancel,
}: LocationFormProps) {
  const [imageUrl, setImageUrl] = useState(location?.imageUrl ?? "");
  const [imageUploading, setImageUploading] = useState(false);
  const [chapterId, setChapterId] = useState(location?.chapterId ?? "");
  const [characterIds, setCharacterIds] = useState<string[]>(
    location?.characterIds ??
      location?.characters?.map((character) => character.id) ??
      []
  );
  const [eventIds, setEventIds] = useState<string[]>(
    location?.eventIds ?? location?.events?.map((event) => event.id) ?? []
  );
  const [formError, setFormError] = useState<string | null>(null);

  /** Events already at this place cannot be unlinked here (Option 1). */
  const lockedEventIds = useMemo(
    () =>
      new Set(
        location?.eventIds ??
          location?.events?.map((event) => event.id) ??
          []
      ),
    [location]
  );

  function handleEventIdsChange(next: string[]) {
    const merged = [...new Set([...lockedEventIds, ...next])];
    setEventIds(merged);
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setFormError(null);

    const form = new FormData(formEvent.currentTarget);
    const name = readText(form, "name").trim();
    const description = readText(form, "description").trim();

    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (!imageUrl.trim()) {
      setFormError("Location image is required.");
      return;
    }
    if (!description) {
      setFormError("Description is required.");
      return;
    }
    if (!chapterId.trim()) {
      setFormError("Unlock chapter is required.");
      return;
    }

    const base: CreateLocationInput = {
      name,
      description,
      imageUrl: resolveImageForSave(imageUrl, location?.imageUrl),
      chapterId: creating
        ? chapterId
        : nullableField(chapterId),
      // Character selection stays optional.
      characterIds: characterIds.filter((id) => id.trim().length > 0),
      eventIds: eventIds.filter((id) => id.trim().length > 0),
    };

    await onSave(base);
  }

  return (
    <form
      onSubmit={(formEvent) => void handleSubmit(formEvent)}
      className="space-y-5"
    >
      <FlowGuide
        title="Location setup"
        steps={[
          "Fill in the place basics (name, image, description, unlock chapter).",
          "Optionally link characters and events.",
          "Pin the place on the Story Map and add Explore copy there.",
        ]}
      />

      {formError ? (
        <p className="text-sm text-red-400">{formError}</p>
      ) : null}

      <FormSection
        step={1}
        title="Basics"
        description="Name, image, description, and unlock chapter — all required."
      >
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <InfoImageField
            label="Image *"
            value={imageUrl}
            onChange={setImageUrl}
            variant="landscape"
            uploadType="location"
            entityId={location?.id}
            onUploadingChange={setImageUploading}
          />
          <div className="space-y-4">
            <Input
              label="Name *"
              name="name"
              defaultValue={location?.name}
              required
              placeholder="Enter location name"
            />
            <Textarea
              label="Description *"
              name="description"
              defaultValue={location?.description ?? ""}
              required
              placeholder="Enter location description"
            />
            <ChapterSelectField
              label="Unlock chapter *"
              name="chapterId"
              options={chapterOptions}
              value={chapterId}
              onChange={setChapterId}
              required
              placeholder="Choose chapter"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        step={2}
        title="Connections"
        description="Optional — characters and events at this place. Add “Role in the story” HTML on the Story Map pin."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <MultiSelect
            label="Characters connected to this place (optional)"
            options={characterOptions}
            value={characterIds}
            onChange={setCharacterIds}
            placeholder="Choose characters"
            searchPlaceholder="Search characters…"
            emptyMessage="No characters available"
            hint="Optional. Multiple allowed. Shown on location detail and map pins."
          />
          <MultiSelect
            label="Events at this place (optional)"
            options={eventOptions}
            value={eventIds}
            onChange={handleEventIdsChange}
            placeholder="Choose events"
            searchPlaceholder="Search events…"
            emptyMessage="No events available"
            hint="Optional. Adding moves the event here; to remove, change its location on the Event form."
          />
        </div>
      </FormSection>

      <FormActions
        submitLabel={
          saving
            ? "Saving…"
            : creating
              ? "Create Location"
              : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving || imageUploading}
      />
    </form>
  );
}
