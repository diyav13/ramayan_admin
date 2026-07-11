"use client";

import { ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { Field } from "@/components/ui/Field";

type ChapterThumbnailFieldProps = {
  value: string;
  onChange: (url: string) => void;
};

const previewClass =
  "h-24 w-36 shrink-0 rounded bg-[var(--surface)] object-cover ring-1 ring-white/10";

/**
 * Chapter thumbnail picker.
 * Upload API is temporarily disabled — selected files use a local object URL for preview.
 */
export function ChapterThumbnailField({
  value,
  onChange,
}: ChapterThumbnailFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function revokeLocalPreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    event.target.blur();
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError(null);

    // Temporary: skip thumbnail upload API and preview locally.
    // const url = await uploadService.thumbnail(file);
    revokeLocalPreview();
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    onChange(localUrl);
  }

  function handleRemove() {
    revokeLocalPreview();
    setError(null);
    onChange("");
  }

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <Field label="Thumbnail" htmlFor={inputId}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="relative w-fit">
          <img
            src={value}
            alt="Chapter thumbnail"
            className={previewClass}
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove thumbnail"
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-white/15 bg-[var(--surface)] text-[var(--text-muted)] outline-none transition hover:bg-red-500/20 hover:text-red-300"
          >
            <CrossIcon />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="flex h-24 w-36 flex-col items-center justify-center gap-1.5 rounded border border-dashed border-white/15 bg-[var(--surface)] text-center outline-none transition hover:border-white/25 hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-[var(--gold)]"
        >
          <ImageIcon />
          <span className="text-xs text-[var(--text-muted)]">Choose image</span>
        </button>
      )}

      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </Field>
  );
}

function CrossIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      width="20"
      height="20"
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
