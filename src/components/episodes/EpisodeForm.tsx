"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ChapterSelectField } from "@/components/chapters/ChapterSelectField";
import type { ChapterSelectOption } from "@/components/chapters/ChapterSelectField";
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

const QUIZ_INSTRUCTION_MIN = 1;
const QUIZ_INSTRUCTION_MAX = 4;

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

/**
 * Persist the uploaded S3 asset URL. Guard against blob: previews leaking in —
 * the field only emits a real URL after the multipart upload completes.
 */
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
  locationIds: string[],
  quizInstructionIds: string[]
): CreateEpisodeInput | UpdateEpisodeInput {
  return {
    chapterId: readText(form, "chapterId"),
    title: readText(form, "title"),
    description: optionalField(readText(form, "description")),
    moralOfTheStory: nullableField(readText(form, "moralOfTheStory")),
    infoTitle: nullableField(readText(form, "infoTitle")),
    infoDescription: nullableField(readText(form, "infoDescription")),
    maxQuizQuestions: readNumber(form, "maxQuizQuestions"),
    thumbnailUrl: resolveThumbnailForSave(thumbnailPreview, existingThumbnail),
    videoUrl: resolveMediaForSave(videoPreview, existingVideo),
    orderIndex: toApiOrder(readNumber(form, "orderIndex")),
    isPublished: readCheckbox(form, "isPublished"),
    characterIds: characterIds.filter((id) => id.trim().length > 0),
    locationIds: locationIds.filter((id) => id.trim().length > 0),
    quizInstructionIds: quizInstructionIds.filter((id) => id.trim().length > 0),
  };
}

export function EpisodeForm({
  episode,
  chapterOptions,
  characterOptions,
  locationOptions,
  quizInstructionOptions,
  saving,
  creating,
  defaultDisplayOrder = 1,
  onSave,
  onCancel,
}: {
  episode: Episode | null;
  chapterOptions: ChapterSelectOption[];
  characterOptions: { value: string; label: string }[];
  locationOptions: { value: string; label: string }[];
  quizInstructionOptions: { value: string; label: string }[];
  saving: boolean;
  creating: boolean;
  defaultDisplayOrder?: number;
  onSave: (payload: CreateEpisodeInput | UpdateEpisodeInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState(episode?.thumbnailUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(episode?.videoUrl ?? "");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [characterIds, setCharacterIds] = useState<string[]>(
    episode?.characterIds ?? episode?.characters?.map((item) => item.id) ?? []
  );
  const [locationIds, setLocationIds] = useState<string[]>(
    episode?.locationIds ?? episode?.locations?.map((item) => item.id) ?? []
  );
  const [quizInstructionIds, setQuizInstructionIds] = useState<string[]>(
    episode?.quizInstructionIds ??
      episode?.quizInstructions?.map((item) => item.id) ??
      []
  );
  const [quizInstructionError, setQuizInstructionError] = useState<
    string | null
  >(null);
  const displayOrder = episode ? episode.orderIndex + 1 : defaultDisplayOrder;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedInstructions = quizInstructionIds.filter(
      (id) => id.trim().length > 0
    );

    if (
      cleanedInstructions.length < QUIZ_INSTRUCTION_MIN ||
      cleanedInstructions.length > QUIZ_INSTRUCTION_MAX
    ) {
      setQuizInstructionError(
        `Select between ${QUIZ_INSTRUCTION_MIN} and ${QUIZ_INSTRUCTION_MAX} quiz instructions.`
      );
      return;
    }

    setQuizInstructionError(null);
    const form = new FormData(event.currentTarget);
    const payload = buildEpisodePayload(
      form,
      thumbnailUrl,
      videoUrl,
      episode?.thumbnailUrl,
      episode?.videoUrl,
      characterIds,
      locationIds,
      cleanedInstructions
    );
    await onSave(payload);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Title" name="title" defaultValue={episode?.title} required />
        <ChapterSelectField
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

      <div className="rounded-lg border border-white/10 bg-[var(--surface)]/40 p-4 space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Info tab (app)
        </p>
        <Input
          label="Info title"
          name="infoTitle"
          defaultValue={episode?.infoTitle ?? ""}
          placeholder="e.g. Birth Of The Four Brothers"
        />
        <Textarea
          label="Info description"
          name="infoDescription"
          defaultValue={episode?.infoDescription ?? ""}
          placeholder="Story context shown in the app INFO tab…"
        />
      </div>

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

      <MultiSelect
        label="Quiz instructions"
        options={quizInstructionOptions}
        value={quizInstructionIds}
        onChange={(next) => {
          setQuizInstructionIds(next);
          if (quizInstructionError) setQuizInstructionError(null);
        }}
        placeholder="Select quiz instructions"
        searchPlaceholder="Search quiz instructions…"
        emptyMessage="No quiz instructions yet — add them in Information."
        min={QUIZ_INSTRUCTION_MIN}
        max={QUIZ_INSTRUCTION_MAX}
        error={quizInstructionError}
      />

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
        <div className="w-36 shrink-0">
          <Input
            label="Quiz questions"
            name="maxQuizQuestions"
            type="number"
            min={1}
            max={50}
            defaultValue={episode?.maxQuizQuestions ?? 5}
            required
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
        <EpisodeVideoField
          value={videoUrl}
          onChange={setVideoUrl}
          episodeId={episode?.id}
          initialUploadStatus={episode?.videoUploadStatus}
          onUploadingChange={setVideoUploading}
        />
      </div>

      <FormActions
        submitLabel={
          saving ? "Saving…" : creating ? "Create Episode" : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving || thumbnailUploading || videoUploading}
      />
    </form>
  );
}
