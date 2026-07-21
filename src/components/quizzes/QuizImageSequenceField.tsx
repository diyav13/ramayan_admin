"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Field } from "@/components/ui/Field";
import { getErrorMessage } from "@/lib/api/errors";
import { validateQuizImageFile } from "@/lib/api/quiz-image-upload";
import { uploadService } from "@/services/uploads";

const MAX_IMAGES = 10;

type QuizImageSequenceFieldProps = {
  images: string[];
  onChange: (images: string[]) => void;
  chapterId: string;
  episodeId: string;
  /** Existing quiz id when editing — uploads land under that question folder. */
  questionId?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

/**
 * Multi-image picker for image-sequence questions.
 * Presign → S3 PUT → public URL; drag cards to set the correct answer order.
 */
export function QuizImageSequenceField({
  images,
  onChange,
  chapterId,
  episodeId,
  questionId,
  onUploadingChange,
}: QuizImageSequenceFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const draftIdRef = useRef<string | undefined>(undefined);
  const imagesRef = useRef(images);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);

  const canUpload = Boolean(chapterId && episodeId);
  const isUploading = uploadingCount > 0;

  imagesRef.current = images;

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  useEffect(() => {
    draftIdRef.current = undefined;
  }, [chapterId, episodeId, questionId]);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      objectUrlsRef.current.clear();
    };
  }, []);

  function revokeBlobUrl(url: string) {
    if (url.startsWith("blob:") && objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  }

  function replaceBlobAt(index: number, publicUrl: string) {
    const current = imagesRef.current;
    const blobUrl = current[index];
    if (blobUrl) revokeBlobUrl(blobUrl);

    const next = [...current];
    next[index] = publicUrl;
    onChange(next);
  }

  function removeBlobPlaceholders(indices: number[]) {
    const current = imagesRef.current;
    const removeSet = new Set(indices);
    const next = current.filter((url, index) => {
      if (removeSet.has(index)) {
        revokeBlobUrl(url);
        return false;
      }
      return true;
    });
    onChange(next);
  }

  async function uploadFileAt(file: File, index: number) {
    const result = await uploadService.quizImage(file, {
      chapterId,
      episodeId,
      sequenceIndex: index,
      questionId,
      draftId: draftIdRef.current,
    });

    if (result.draftId) {
      draftIdRef.current = result.draftId;
    }

    replaceBlobAt(index, result.publicUrl);
  }

  async function addFiles(files: File[]) {
    if (files.length === 0) return;

    if (!canUpload) {
      setError("Select chapter and episode before uploading images.");
      return;
    }

    const currentCount = imagesRef.current.length;
    if (currentCount + files.length > MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    const invalid = files.find((file) => validateQuizImageFile(file));
    if (invalid) {
      const message = validateQuizImageFile(invalid);
      setError(message ?? "Invalid image file.");
      return;
    }

    setError(null);

    const startIndex = currentCount;
    const blobUrls = files.map((file) => {
      const localUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(localUrl);
      return localUrl;
    });

    onChange([...imagesRef.current, ...blobUrls]);
    setUploadingCount((count) => count + files.length);

    const results = await Promise.allSettled(
      files.map((file, offset) => uploadFileAt(file, startIndex + offset))
    );

    const failedIndices: number[] = [];
    results.forEach((result, offset) => {
      if (result.status === "rejected") {
        failedIndices.push(startIndex + offset);
      }
    });

    setUploadingCount((count) => Math.max(0, count - files.length));

    if (failedIndices.length > 0) {
      removeBlobPlaceholders(failedIndices);
      const firstError = results.find(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );
      setError(
        getErrorMessage(
          firstError?.reason,
          failedIndices.length === files.length
            ? "Image upload failed"
            : "Some images failed to upload"
        )
      );
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void addFiles(files);
  }

  function handleRemove(index: number) {
    if (isUploading) return;
    revokeBlobUrl(images[index]);
    onChange(images.filter((_, i) => i !== index));
  }

  function reorder(from: number, to: number) {
    if (isUploading) return;
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= images.length ||
      to >= images.length
    ) {
      return;
    }
    const copy = [...images];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    onChange(copy);
  }

  function handleDragStart(index: number) {
    if (isUploading) return;
    setDragIndex(index);
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  }

  function handleDrop(event: DragEvent, index: number) {
    event.preventDefault();
    if (dragIndex !== null) {
      reorder(dragIndex, index);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function handlePickerDragOver(event: DragEvent) {
    event.preventDefault();
    if (!canUpload || isUploading) return;
    setIsDropActive(true);
  }

  function handlePickerDragLeave(event: DragEvent) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDropActive(false);
  }

  function handlePickerDrop(event: DragEvent) {
    event.preventDefault();
    setIsDropActive(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    void addFiles(files);
  }

  return (
    <Field label="Images (correct order)" htmlFor={inputId}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={handleFileChange}
        disabled={!canUpload || isUploading || images.length >= MAX_IMAGES}
      />

      {!canUpload ? (
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Select chapter and episode before adding images.
        </p>
      ) : null}

      {images.length > 0 ? (
        <ul className="mb-3 flex flex-wrap gap-3">
          {images.map((url, index) => {
            const isDragging = dragIndex === index;
            const isOver = overIndex === index && dragIndex !== index;
            const isBlob = url.startsWith("blob:");

            return (
              <li
                key={`${url}-${index}`}
                draggable={!isUploading}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(event) => handleDragOver(event, index)}
                onDrop={(event) => handleDrop(event, index)}
                onDragEnd={handleDragEnd}
                className={`group relative w-28 shrink-0 overflow-hidden rounded border bg-[var(--surface)] ${
                  isUploading ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                } ${
                  isDragging
                    ? "border-[var(--gold)] opacity-50"
                    : isOver
                      ? "border-[var(--gold)] ring-1 ring-[var(--gold)]"
                      : "border-white/10"
                }`}
              >
                <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1">
                  <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  {!isUploading ? (
                    <span
                      aria-hidden
                      className="rounded bg-black/50 px-1 py-0.5 text-[var(--text-muted)]"
                    >
                      <GripIcon />
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={isUploading}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500/80 disabled:opacity-0"
                >
                  <CrossIcon />
                </button>

                <img
                  src={url}
                  alt={`Sequence image ${index + 1}`}
                  className={`aspect-square w-full object-cover ${
                    isBlob && isUploading ? "opacity-60" : ""
                  }`}
                  draggable={false}
                />

                {isBlob && isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] text-white">
                    Uploading…
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={handlePickerDragOver}
        onDragLeave={handlePickerDragLeave}
        onDrop={handlePickerDrop}
        disabled={!canUpload || isUploading || images.length >= MAX_IMAGES}
        className={`flex h-24 w-full max-w-md flex-col items-start justify-center gap-1 rounded border border-dashed px-4 text-left outline-none transition focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60 ${
          isDropActive
            ? "border-[var(--gold)] bg-[var(--gold)]/10"
            : "border-white/15 bg-[var(--surface)] hover:border-white/25 hover:bg-white/5"
        }`}
      >
        <span className="flex items-center gap-2 text-sm text-white">
          <ImageIcon />
          {isUploading
            ? "Uploading images…"
            : images.length > 0
              ? "Add more images"
              : "Drop images here or browse"}
        </span>
        <span className="pl-7 text-xs text-[var(--text-muted)]">
          JPEG, PNG, or WebP · up to {MAX_IMAGES} · drag to set order
        </span>
      </button>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </Field>
  );
}

function GripIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--text-muted)]"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
