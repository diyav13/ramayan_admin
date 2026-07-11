"use client";

import { FormEvent, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { InfoImageField } from "@/components/information/InfoImageField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { optionalField, readText } from "@/lib/utils";

export type InfoEntityValues = {
  name: string;
  imageUrl: string | null;
  description: string | null;
};

export type InfoEntityPayload = {
  name: string;
  imageUrl?: string;
  description?: string;
};

/** While upload API is disabled, ignore local blob previews when saving. */
function resolveImageForSave(
  previewUrl: string,
  existingUrl: string | null | undefined
): string | undefined {
  if (!previewUrl) return undefined;
  if (previewUrl.startsWith("blob:")) {
    return existingUrl ? existingUrl : undefined;
  }
  return optionalField(previewUrl);
}

function buildPayload(
  form: FormData,
  imagePreview: string,
  existingImage: string | null | undefined
): InfoEntityPayload {
  return {
    name: readText(form, "name"),
    description: optionalField(readText(form, "description")),
    imageUrl: resolveImageForSave(imagePreview, existingImage),
  };
}

type InfoEntityFormProps = {
  entity: InfoEntityValues | null;
  entityLabel: string;
  saving: boolean;
  creating: boolean;
  imageVariant?: "portrait" | "landscape";
  onSave: (payload: InfoEntityPayload) => Promise<void>;
  onCancel: () => void;
};

export function InfoEntityForm({
  entity,
  entityLabel,
  saving,
  creating,
  imageVariant = "portrait",
  onSave,
  onCancel,
}: InfoEntityFormProps) {
  const [imageUrl, setImageUrl] = useState(entity?.imageUrl ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildPayload(
      new FormData(event.currentTarget),
      imageUrl,
      entity?.imageUrl
    );
    await onSave(payload);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
        <InfoImageField
          value={imageUrl}
          onChange={setImageUrl}
          variant={imageVariant}
        />
        <div className="space-y-4">
          <Input
            label="Name"
            name="name"
            defaultValue={entity?.name}
            required
            placeholder={`${entityLabel} name`}
          />
          <Textarea
            label="Description"
            name="description"
            defaultValue={entity?.description ?? ""}
            placeholder={`Short description of this ${entityLabel.toLowerCase()}`}
          />
        </div>
      </div>

      <FormActions
        submitLabel={
          saving
            ? "Saving…"
            : creating
              ? `Create ${entityLabel}`
              : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving}
      />
    </form>
  );
}
