"use client";

import { FormEvent, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { InfoImageField } from "@/components/information/InfoImageField";
import { DarkSelectField } from "@/components/ui/DarkSelectField";
import { Field, controlClass } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { nullableField, optionalField, readText } from "@/lib/utils";
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";

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

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setFormError(null);

    const form = new FormData(formEvent.currentTarget);
    const name = readText(form, "name").trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }

    const title = readText(form, "title");
    const lineage = readText(form, "lineage");
    const description = readText(form, "description");
    const relationshipsBlurb = readText(form, "relationshipsBlurb");

    const base: CreateCharacterInput = {
      name,
      title: optionalField(title),
      lineage: optionalField(lineage),
      description: optionalField(description),
      relationshipsBlurb: optionalField(relationshipsBlurb),
      imageUrl: resolveImageForSave(imageUrl, character?.imageUrl),
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
    ...eventOptions,
  ];

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
          label="Portrait"
          value={imageUrl}
          onChange={setImageUrl}
          variant="portrait"
          uploadType="character"
          entityId={character?.id}
          onUploadingChange={setImageUploading}
        />
        <div className="space-y-4">
          <Input
            label="Name"
            name="name"
            defaultValue={character?.name}
            required
            placeholder="Enter character name"
          />
          <Field
            label="Title"
            htmlFor="character-title"
            description="Shown under the name on Explore characters and as a short role line."
          >
            <input
              id="character-title"
              name="title"
              defaultValue={character?.title ?? ""}
              placeholder="Enter short title or role"
              className={`${controlClass} h-14 px-4`}
            />
          </Field>
          <Field
            label="Lineage"
            htmlFor="character-lineage"
            description="Gold meta line on the Explore character detail screen."
          >
            <input
              id="character-lineage"
              name="lineage"
              defaultValue={character?.lineage ?? ""}
              placeholder="Enter dynasty, kingdom, or lineage"
              className={`${controlClass} h-14 px-4`}
            />
          </Field>
        </div>
      </div>

      <Field
        label="Biography"
        htmlFor="character-description"
        description="Used for Dive Deeper character cards and the Explore character biography."
      >
        <textarea
          id="character-description"
          name="description"
          rows={5}
          defaultValue={character?.description ?? ""}
          placeholder="Enter character biography"
          className={`${controlClass} resize-none px-4 py-3`}
        />
      </Field>

      <Field
        label="Relationships"
        htmlFor="character-relationships"
        description="Intro text under Relationships on Explore detail. Relationship graph is managed separately."
      >
        <textarea
          id="character-relationships"
          name="relationshipsBlurb"
          rows={2}
          defaultValue={character?.relationshipsBlurb ?? ""}
          placeholder="Enter a short relationships summary"
          className={`${controlClass} resize-none px-4 py-3`}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <MultiSelect
          label="Places in their journey"
          options={locationOptions}
          value={locationIds}
          onChange={setLocationIds}
          placeholder="Choose places"
          searchPlaceholder="Search locations…"
          emptyMessage="No locations available"
          hint="Shown as chips on the Explore character detail screen."
        />
        <DarkSelectField
          label="Key event"
          name="keyEventId"
          options={keyEventOptions}
          value={keyEventId}
          onChange={setKeyEventId}
          placeholder="Choose a key event (optional)"
        />
      </div>

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
