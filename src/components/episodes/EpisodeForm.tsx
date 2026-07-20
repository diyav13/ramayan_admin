"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormActions } from "@/components/FormActions";
import { EpisodeThumbnailField } from "@/components/episodes/EpisodeThumbnailField";
import { EpisodeVideoField } from "@/components/episodes/EpisodeVideoField";
import {
  nullableField,
  optionalField,
  readCheckbox,
  readNumber,
  readText,
} from "@/lib/utils";
import type {
  CreateEpisodeInput,
  Episode,
  UpdateEpisodeInput,
} from "@/types/episode";

/** Persist uploaded S3 URLs; allow clearing on update when user removes thumbnail. */
function resolveThumbnailForSave(
  previewUrl: string,
  existingUrl: string | null | undefined
): string | undefined | null {
  if (!previewUrl) {
    return existingUrl ? null : undefined;
  }
  return optionalField(previewUrl);
}

/** While video upload API is disabled, ignore local blob previews when saving. */
function resolveMediaForSave(
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

function buildEpisodePayload(
  form: FormData,
  thumbnailPreview: string,
  videoPreview: string,
  existingThumbnail: string | null | undefined,
  existingVideo: string | null | undefined,
  characterIds: string[],
  locationIds: string[]
): CreateEpisodeInput | UpdateEpisodeInput {
  return {
    chapterId: readText(form, "chapterId"),
    title: readText(form, "title"),
    description: optionalField(readText(form, "description")),
    moralOfTheStory: nullableField(readText(form, "moralOfTheStory")),
    thumbnailUrl: resolveThumbnailForSave(thumbnailPreview, existingThumbnail),
    videoUrl: resolveMediaForSave(videoPreview, existingVideo),
    orderIndex: toApiOrder(readNumber(form, "orderIndex")),
    isPublished: readCheckbox(form, "isPublished"),
    characterIds: characterIds.filter((id) => id.trim().length > 0),
    locationIds: locationIds.filter((id) => id.trim().length > 0),
  };
}

export function EpisodeForm({
  episode,
  chapterOptions,
  characterOptions,
  locationOptions,
  saving,
  creating,
  defaultDisplayOrder = 1,
  onSave,
  onCancel,
}: {
  episode: Episode | null;
  chapterOptions: { value: string; label: string }[];
  characterOptions: { value: string; label: string }[];
  locationOptions: { value: string; label: string }[];
  saving: boolean;
  creating: boolean;
  defaultDisplayOrder?: number;
  onSave: (payload: CreateEpisodeInput | UpdateEpisodeInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState(episode?.thumbnailUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(episode?.videoUrl ?? "");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [characterIds, setCharacterIds] = useState<string[]>(
    episode?.characterIds ?? episode?.characters?.map((item) => item.id) ?? []
  );
  const [locationIds, setLocationIds] = useState<string[]>(
    episode?.locationIds ?? episode?.locations?.map((item) => item.id) ?? []
  );
  const displayOrder = episode ? episode.orderIndex + 1 : defaultDisplayOrder;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const resolvedThumb = resolveThumbnailForSave(
      thumbnailUrl,
      episode?.thumbnailUrl
    );
    const payload = buildEpisodePayload(
      form,
      thumbnailUrl,
      videoUrl,
      episode?.thumbnailUrl,
      episode?.videoUrl,
      characterIds,
      locationIds
    );
    // #region agent log
    console.log("[thumb-debug] form submit", {
      thumbnailUrlState: thumbnailUrl,
      existingThumbnail: episode?.thumbnailUrl,
      resolvedThumb,
      payloadThumbnailUrl: payload.thumbnailUrl,
      thumbnailUploading,
    });
    fetch('http://127.0.0.1:7575/ingest/74428e7d-57d1-4707-9993-faa512483745',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'98511f'},body:JSON.stringify({sessionId:'98511f',runId:'post-fix',location:'EpisodeForm.tsx:handleSubmit',message:'form submit',data:{thumbnailUrlState:thumbnailUrl||null,existingThumbnail:episode?.thumbnailUrl??null,resolvedThumb:resolvedThumb??null,payloadThumbnailUrl:payload.thumbnailUrl??null,thumbnailUploading},timestamp:Date.now(),hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion
    await onSave(payload);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Title" name="title" defaultValue={episode?.title} required />
        <Select
          label="Chapter"
          name="chapterId"
          options={chapterOptions}
          defaultValue={episode?.chapterId ?? chapterOptions[0]?.value}
          required
        />
      </div>

      <Textarea
        label="Description"
        name="description"
        defaultValue={episode?.description ?? ""}
      />

      <Textarea
        label="Moral of the Story"
        name="moralOfTheStory"
        defaultValue={episode?.moralOfTheStory ?? ""}
        placeholder="e.g. Honesty and courage lead to the right path."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <MultiSelect
          label="Characters"
          options={characterOptions}
          value={characterIds}
          onChange={setCharacterIds}
          placeholder="Select characters"
          searchPlaceholder="Search characters…"
          emptyMessage="No characters yet — add them in Information."
        />
        <MultiSelect
          label="Locations"
          options={locationOptions}
          value={locationIds}
          onChange={setLocationIds}
          placeholder="Select locations"
          searchPlaceholder="Search locations…"
          emptyMessage="No locations yet — add them in Information."
        />
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="w-28 shrink-0">
          <Input
            label="Order"
            name="orderIndex"
            type="number"
            min={1}
            defaultValue={displayOrder}
          />
        </div>
        <div className="pb-4">
          <Checkbox
            label="Published"
            name="isPublished"
            defaultChecked={episode?.isPublished ?? false}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <EpisodeThumbnailField
          value={thumbnailUrl}
          onChange={setThumbnailUrl}
          episodeId={episode?.id}
          onUploadingChange={setThumbnailUploading}
        />
        <EpisodeVideoField value={videoUrl} onChange={setVideoUrl} />
      </div>

      <FormActions
        submitLabel={
          saving ? "Saving…" : creating ? "Create Episode" : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving || thumbnailUploading}
      />
    </form>
  );
}
