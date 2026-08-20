"use client";

import { FormEvent, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { AvatarImageField } from "@/components/avatars/AvatarImageField";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { optionalField, readCheckbox, readText } from "@/lib/utils";
import type {
  Avatar,
  CreateAvatarInput,
  UpdateAvatarInput,
} from "@/types/avatar";

const NAME_MAX_LENGTH = 80;
const AVATAR_URL_MARKER = "/assets/avatars/";

type FieldErrors = {
  name?: string;
  imageUrl?: string;
};

/** Persist uploaded S3 URLs; allow clearing on update when user removes the image. */
function resolveImageForSave(
  previewUrl: string,
  existingUrl: string | null | undefined
): string | undefined | null {
  if (!previewUrl) {
    return existingUrl ? null : undefined;
  }
  return optionalField(previewUrl);
}

function validateName(raw: string): string | undefined {
  const name = raw.trim();
  if (!name) {
    return "Name is required.";
  }
  if (name.length > NAME_MAX_LENGTH) {
    return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }
  return undefined;
}

function validateImageUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Avatar image is required.";
  }
  if (!trimmed.includes(AVATAR_URL_MARKER)) {
    return "Image must be uploaded to the avatar catalog (assets/avatars/).";
  }
  return undefined;
}

function buildPayload(
  form: FormData,
  imagePreview: string,
  existingImage: string | null | undefined
): CreateAvatarInput {
  return {
    name: readText(form, "name").trim(),
    imageUrl: resolveImageForSave(imagePreview, existingImage),
    isActive: readCheckbox(form, "isActive"),
  };
}

type AvatarFormProps = {
  avatar: Avatar | null;
  saving: boolean;
  creating: boolean;
  onSave: (payload: CreateAvatarInput | UpdateAvatarInput) => Promise<void>;
  onCancel: () => void;
};

export function AvatarForm({
  avatar,
  saving,
  creating,
  onSave,
  onCancel,
}: AvatarFormProps) {
  const [imageUrl, setImageUrl] = useState(avatar?.imageUrl ?? "");
  const [imageUploading, setImageUploading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleImageChange(url: string) {
    setImageUrl(url);
    setErrors((prev) => {
      if (!prev.imageUrl) return prev;
      const next = { ...prev };
      delete next.imageUrl;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = readText(formData, "name");

    const nextErrors: FieldErrors = {
      name: validateName(name),
      imageUrl: validateImageUrl(imageUrl),
    };

    if (imageUploading) {
      nextErrors.imageUrl = "Please wait for the image upload to finish.";
    }

    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.imageUrl) {
      return;
    }

    const payload = buildPayload(formData, imageUrl, avatar?.imageUrl);
    await onSave(payload);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
        <AvatarImageField
          value={imageUrl}
          onChange={handleImageChange}
          entityId={avatar?.id}
          onUploadingChange={setImageUploading}
          error={errors.imageUrl}
          required
        />
        <div className="space-y-4">
          <div>
            <Input
              label="Name"
              name="name"
              defaultValue={avatar?.name}
              required
              maxLength={NAME_MAX_LENGTH}
              placeholder="e.g. Rama, Sita, Golden Deer"
              aria-invalid={Boolean(errors.name)}
              onChange={() =>
                setErrors((prev) => {
                  if (!prev.name) return prev;
                  const next = { ...prev };
                  delete next.name;
                  return next;
                })
              }
              className={errors.name ? "ring-1 ring-red-400" : ""}
            />
            {errors.name ? (
              <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
            ) : (
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                Up to {NAME_MAX_LENGTH} characters.
              </p>
            )}
          </div>
          <Checkbox
            label="Active (visible in the app)"
            name="isActive"
            defaultChecked={avatar?.isActive ?? true}
          />
        </div>
      </div>

      <FormActions
        submitLabel={
          saving ? "Saving…" : creating ? "Create Avatar" : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving || imageUploading}
      />
    </form>
  );
}
