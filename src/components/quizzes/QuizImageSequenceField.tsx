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
// import { getErrorMessage } from "@/lib/api/errors";
// import { uploadService } from "@/services/uploads";

type QuizImageSequenceFieldProps = {
  images: string[];
  onChange: (images: string[]) => void;
};

/**
 * Multi-image picker for image-sequence questions.
 * Upload API is temporarily disabled — selected files use local object URLs for preview.
 * Drag cards to set the correct answer order.
 */
export function QuizImageSequenceField({
  images,
  onChange,
}: QuizImageSequenceFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      objectUrlsRef.current.clear();
    };
  }, []);

  function addFiles(files: File[]) {
    if (files.length === 0) return;

    const invalid = files.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      setError("Please choose image files only.");
      return;
    }

    if (images.length + files.length > 10) {
      setError("You can add up to 10 images.");
      return;
    }

    setError(null);

    // Temporary: skip quiz-image upload API and preview locally.
    // const urls: string[] = [];
    // for (const file of files) {
    //   urls.push(await uploadService.quizImage(file));
    // }
    // onChange([...images, ...urls]);

    const nextUrls = files.map((file) => {
      const localUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(localUrl);
      return localUrl;
    });
    onChange([...images, ...nextUrls]);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    addFiles(files);
  }

  function handleRemove(index: number) {
    const url = images[index];
    if (url?.startsWith("blob:") && objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
    onChange(images.filter((_, i) => i !== index));
  }

  function reorder(from: number, to: number) {
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
    setIsDropActive(true);
  }

  function handlePickerDragLeave(event: DragEvent) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDropActive(false);
  }

  function handlePickerDrop(event: DragEvent) {
    event.preventDefault();
    setIsDropActive(false);
    const files = Array.from(event.dataTransfer.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );
    addFiles(files);
  }

  return (
    <Field label="Images (correct order)" htmlFor={inputId}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={handleFileChange}
      />

      {images.length > 0 ? (
        <ul className="mb-3 flex flex-wrap gap-3">
          {images.map((url, index) => {
            const isDragging = dragIndex === index;
            const isOver = overIndex === index && dragIndex !== index;

            return (
              <li
                key={`${url}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(event) => handleDragOver(event, index)}
                onDrop={(event) => handleDrop(event, index)}
                onDragEnd={handleDragEnd}
                className={`group relative w-28 shrink-0 cursor-grab overflow-hidden rounded border bg-[var(--surface)] active:cursor-grabbing ${
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
                  <span
                    aria-hidden
                    className="rounded bg-black/50 px-1 py-0.5 text-[var(--text-muted)]"
                  >
                    <GripIcon />
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500/80"
                >
                  <CrossIcon />
                </button>

                <img
                  src={url}
                  alt={`Sequence image ${index + 1}`}
                  className="aspect-square w-full object-cover"
                  draggable={false}
                />
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
        disabled={images.length >= 10}
        className={`flex h-24 w-full max-w-md flex-col items-start justify-center gap-1 rounded border border-dashed px-4 text-left outline-none transition focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60 ${
          isDropActive
            ? "border-[var(--gold)] bg-[var(--gold)]/10"
            : "border-white/15 bg-[var(--surface)] hover:border-white/25 hover:bg-white/5"
        }`}
      >
        <span className="flex items-center gap-2 text-sm text-white">
          <ImageIcon />
          {images.length > 0 ? "Add more images" : "Drop images here or browse"}
        </span>
        <span className="pl-7 text-xs text-[var(--text-muted)]">
          JPEG, PNG, WebP, or GIF · up to 10 · drag to set order
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
