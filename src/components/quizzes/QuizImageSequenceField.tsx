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
import type { QuizImageSequenceFormItem } from "@/lib/quizzes";
import { uploadService } from "@/services/uploads";

const MAX_IMAGES = 10;

type QuizImageSequenceFieldProps = {
  items: QuizImageSequenceFormItem[];
  onChange: (items: QuizImageSequenceFormItem[]) => void;
  chapterId: string;
  episodeId: string;
  /** Existing quiz id when editing — uploads land under that question folder. */
  questionId?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * Multi-image picker for image-sequence questions.
 * Each row: index, thumbnail, optional label, drag handle.
 */
export function QuizImageSequenceField({
  items,
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
  const itemsRef = useRef(items);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);

  const canUpload = Boolean(chapterId && episodeId);
  const isUploading = uploadingCount > 0;

  itemsRef.current = items;

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
    const current = itemsRef.current;
    const blobUrl = current[index]?.imageUrl;
    if (blobUrl) revokeBlobUrl(blobUrl);

    const next = [...current];
    next[index] = { ...next[index], imageUrl: publicUrl };
    onChange(next);
  }

  function removeAtIndices(indices: number[]) {
    const current = itemsRef.current;
    const removeSet = new Set(indices);
    const next = current.filter((item, index) => {
      if (removeSet.has(index)) {
        revokeBlobUrl(item.imageUrl);
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

    const currentCount = itemsRef.current.length;
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
    const newItems: QuizImageSequenceFormItem[] = files.map((file) => {
      const localUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(localUrl);
      return { imageUrl: localUrl, text: "" };
    });

    onChange([...itemsRef.current, ...newItems]);
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
      removeAtIndices(failedIndices);
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
    revokeBlobUrl(items[index].imageUrl);
    onChange(items.filter((_, i) => i !== index));
  }

  function updateText(index: number, text: string) {
    const next = [...items];
    next[index] = { ...next[index], text };
    onChange(next);
  }

  function reorder(from: number, to: number) {
    if (isUploading) return;
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= items.length ||
      to >= items.length
    ) {
      return;
    }
    const copy = [...items];
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
        disabled={!canUpload || isUploading || items.length >= MAX_IMAGES}
      />

      {!canUpload ? (
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Select chapter and episode before adding images.
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {items.map((item, index) => {
            const isDragging = dragIndex === index;
            const isOver = overIndex === index && dragIndex !== index;
            const isBlob = item.imageUrl.startsWith("blob:");

            return (
              <li
                key={`${item.imageUrl}-${index}`}
                draggable={!isUploading}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(event) => handleDragOver(event, index)}
                onDrop={(event) => handleDrop(event, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-3 rounded-md border bg-[var(--surface)] px-3 py-2.5 ${
                  isUploading ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                } ${
                  isDragging
                    ? "border-[var(--gold)] opacity-50"
                    : isOver
                      ? "border-[var(--gold)] ring-1 ring-[var(--gold)]"
                      : "border-white/10"
                }`}
              >
                <span className="w-7 shrink-0 text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                  {formatIndex(index)}
                </span>

                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-black/20">
                  <img
                    src={item.imageUrl}
                    alt={`Sequence image ${index + 1}`}
                    className={`h-full w-full object-cover ${
                      isBlob && isUploading ? "opacity-60" : ""
                    }`}
                    draggable={false}
                  />
                  {isBlob && isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] text-white">
                      Uploading…
                    </div>
                  ) : null}
                </div>

                <input
                  type="text"
                  value={item.text}
                  onChange={(event) => updateText(index, event.target.value)}
                  placeholder="Optional label or description"
                  disabled={isUploading}
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-0 disabled:opacity-60"
                />

                <span
                  aria-hidden
                  className="shrink-0 text-[var(--text-muted)] opacity-60 group-hover:opacity-100"
                >
                  <GripIcon />
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={isUploading}
                  aria-label={`Remove image ${index + 1}`}
                  className="shrink-0 text-xs text-[var(--text-muted)] transition hover:text-red-300 disabled:opacity-30"
                >
                  Remove
                </button>
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
        disabled={!canUpload || isUploading || items.length >= MAX_IMAGES}
        className={`flex h-24 w-full flex-col items-start justify-center gap-1 rounded border border-dashed px-4 text-left outline-none transition focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60 ${
          isDropActive
            ? "border-[var(--gold)] bg-[var(--gold)]/10"
            : "border-white/15 bg-[var(--surface)] hover:border-white/25 hover:bg-white/5"
        }`}
      >
        <span className="flex items-center gap-2 text-sm text-white">
          <ImageIcon />
          {isUploading
            ? "Uploading images…"
            : items.length > 0
              ? "Add more images"
              : "Drop images here or browse"}
        </span>
        <span className="pl-7 text-xs text-[var(--text-muted)]">
          JPEG, PNG, or WebP · up to {MAX_IMAGES} · drag rows to set order
        </span>
      </button>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </Field>
  );
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
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
