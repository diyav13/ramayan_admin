"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorField } from "@/components/ui/ColorField";
import { FormActions } from "@/components/FormActions";
import { ChapterThumbnailField } from "@/components/chapters/ChapterThumbnailField";
import {
  optionalField,
  readCheckbox,
  readNumber,
  readText,
} from "@/lib/utils";
import type {
  Chapter,
  CreateChapterInput,
  UpdateChapterInput,
} from "@/types/chapter";

/** While upload API is disabled, ignore local blob previews when saving. */
function resolveThumbnailForSave(
  previewUrl: string,
  existingUrl: string | null | undefined
): string | undefined {
  if (!previewUrl) return undefined;
  if (previewUrl.startsWith("blob:")) {
    return existingUrl ? existingUrl : undefined;
  }
  return optionalField(previewUrl);
}

function toApiOrder(displayOrder: number): number {
  return Math.max(0, displayOrder - 1);
}

function buildPayload(
  form: FormData,
  thumbnailPreview: string,
  existingThumbnail: string | null | undefined
): CreateChapterInput {
  return {
    title: readText(form, "title"),
    tagline: optionalField(readText(form, "tagline")),
    description: optionalField(readText(form, "description")),
    accentColor: optionalField(readText(form, "accentColor")),
    thumbnailUrl: resolveThumbnailForSave(thumbnailPreview, existingThumbnail),
    orderIndex: toApiOrder(readNumber(form, "orderIndex")),
    isPublished: readCheckbox(form, "isPublished"),
    isPremium: readCheckbox(form, "isPremium"),
  };
}

export function ChapterForm({
  chapter,
  saving,
  creating,
  defaultDisplayOrder = 1,
  onSave,
  onCancel,
}: {
  chapter: Chapter | null;
  saving: boolean;
  creating: boolean;
  defaultDisplayOrder?: number;
  onSave: (payload: CreateChapterInput | UpdateChapterInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState(chapter?.thumbnailUrl ?? "");
  const displayOrder = chapter ? chapter.orderIndex + 1 : defaultDisplayOrder;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildPayload(
      new FormData(event.currentTarget),
      thumbnailUrl,
      chapter?.thumbnailUrl
    );
    await onSave(payload);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Title" name="title" defaultValue={chapter?.title} required />
        <Input
          label="Tagline"
          name="tagline"
          defaultValue={chapter?.tagline ?? ""}
        />
      </div>
      <Textarea
        label="Description"
        name="description"
        defaultValue={chapter?.description ?? ""}
      />
      <div className="flex flex-wrap items-end gap-4 sm:gap-6">
        <div className="w-28 shrink-0">
          <Input
            label="Order"
            name="orderIndex"
            type="number"
            min={1}
            defaultValue={displayOrder}
          />
        </div>
        <div className="w-32 shrink-0 sm:w-36">
          <ColorField
            label="Accent Color"
            name="accentColor"
            defaultValue={chapter?.accentColor ?? "#FF6F61"}
          />
        </div>
        <div className="flex flex-wrap gap-6 pb-4">
          <Checkbox
            label="Published"
            name="isPublished"
            defaultChecked={chapter?.isPublished ?? false}
          />
          <Checkbox
            label="Premium"
            name="isPremium"
            defaultChecked={chapter?.isPremium ?? false}
          />
        </div>
      </div>
      <ChapterThumbnailField
        value={thumbnailUrl}
        onChange={setThumbnailUrl}
      />
      <FormActions
        submitLabel={
          saving ? "Saving…" : creating ? "Create Chapter" : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving}
      />
    </form>
  );
}
