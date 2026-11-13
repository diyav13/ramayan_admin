"use client";

import { FormEvent, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { InfoImageField } from "@/components/information/InfoImageField";
import { DarkSelectField } from "@/components/ui/DarkSelectField";
import { HtmlEditor } from "@/components/ui/HtmlEditor";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { nullableField, optionalField, readText } from "@/lib/utils";
import type {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from "@/types/event";

type SelectOption = { value: string; label: string };

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
  locationOptions: SelectOption[];
  characterOptions: SelectOption[];
  saving: boolean;
  creating: boolean;
  onSave: (payload: CreateEventInput | UpdateEventInput) => Promise<void>;
  onCancel: () => void;
};

export function EventForm({
  event,
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
  const [locationId, setLocationId] = useState(event?.locationId ?? "");
  const [characterIds, setCharacterIds] = useState<string[]>(
    event?.characterIds ?? event?.characters?.map((c) => c.id) ?? []
  );
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setFormError(null);

    const name = readText(new FormData(formEvent.currentTarget), "name").trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (!locationId) {
      setFormError("Select a location. Each event belongs to one place.");
      return;
    }

    const descriptionValue = description.trim();
    const base: CreateEventInput = {
      name,
      description: optionalField(descriptionValue),
      imageUrl: resolveImageForSave(imageUrl, event?.imageUrl),
      locationId,
      characterIds: characterIds.filter((id) => id.trim().length > 0),
    };

    const payload: CreateEventInput | UpdateEventInput = creating
      ? base
      : {
          ...base,
          description: nullableField(descriptionValue),
        };

    await onSave(payload);
  }

  return (
    <form
      onSubmit={(formEvent) => void handleSubmit(formEvent)}
      className="space-y-5"
    >
      {formError ? (
        <p className="text-sm text-red-400">{formError}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
        <InfoImageField
          label="Image"
          value={imageUrl}
          onChange={setImageUrl}
          variant="landscape"
          uploadType="event"
          entityId={event?.id}
          onUploadingChange={setImageUploading}
        />
        <Input
          label="Name"
          name="name"
          defaultValue={event?.name}
          required
          placeholder="Enter event name"
        />
      </div>

      <HtmlEditor
        label="Description"
        value={description}
        onChange={setDescription}
        disabled={saving}
        description="HTML body for the Explore event detail screen (summary, what happens, why it matters, and any other story sections)."
        placeholder="Enter the event description…"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <DarkSelectField
          label="Location"
          name="locationId"
          options={locationOptions}
          value={locationId}
          onChange={setLocationId}
          required
          placeholder="Choose a location"
        />
        <MultiSelect
          label="People in this event"
          options={characterOptions}
          value={characterIds}
          onChange={setCharacterIds}
          placeholder="Choose characters"
          searchPlaceholder="Search characters…"
          emptyMessage="No characters available"
          hint="Shown as chips under the story on the event screen."
        />
      </div>

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
