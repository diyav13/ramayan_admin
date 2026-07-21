"use client";

import { ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { Field } from "@/components/ui/Field";
import { getErrorMessage } from "@/lib/api/errors";
import { uploadService } from "@/services/uploads";

type InfoImageFieldProps = {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  /** Portrait crop for characters; landscape for locations. */
  variant?: "portrait" | "landscape";
  /** Which S3 folder to upload into. */
  uploadType: "character" | "location";
  /** Pass when editing so uploads land under that entity folder. */
  entityId?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Image picker for Information Management — same presign → S3 → public URL
 * flow as episode thumbnails. Parent state only stores S3 URLs.
 */
export function InfoImageField({
  label = "Image",
  value,
  onChange,
  variant = "portrait",
  uploadType,
  entityId,
  onUploadingChange,
}: InfoImageFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const displayUrl = localPreview ?? value;

  const previewClass =
    variant === "portrait"
      ? "h-28 w-24 shrink-0 rounded-lg bg-[var(--surface)] object-cover ring-1 ring-white/10"
      : "h-24 w-36 shrink-0 rounded-lg bg-[var(--surface)] object-cover ring-1 ring-white/10";

  const emptyClass =
    variant === "portrait"
      ? "flex h-28 w-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 bg-[var(--surface)] text-center outline-none transition hover:border-white/25 hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:opacity-60"
      : "flex h-24 w-36 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 bg-[var(--surface)] text-center outline-none transition hover:border-white/25 hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:opacity-60";

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

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
    setLocalPreview(null);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    event.target.blur();
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("Image must be 10 MB or smaller.");
      return;
    }

    setError(null);
    revokeLocalPreview();

    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    setLocalPreview(localUrl);

    setUploading(true);

    try {
      const publicUrl = await uploadService.entityImage(
        file,
        uploadType,
        entityId
      );
      revokeLocalPreview();
      onChange(publicUrl);
    } catch (err) {
      revokeLocalPreview();
      setError(getErrorMessage(err, "Image upload failed"));
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    if (uploading) return;
    revokeLocalPreview();
    setError(null);
    onChange("");
  }

  function openPicker() {
    if (uploading) return;
    inputRef.current?.click();
  }

  return (
    <Field label={label} htmlFor={inputId}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
        disabled={uploading}
      />

      {displayUrl ? (
        <div className="relative w-fit">
          <img
            src={displayUrl}
            alt=""
            className={`${previewClass} ${uploading ? "opacity-60" : ""}`}
          />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-xs text-white">
              Uploading…
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Remove image"
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-white/15 bg-[var(--surface)] text-[var(--text-muted)] outline-none transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-60"
          >
            <CrossIcon />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className={emptyClass}
        >
          <ImageIcon />
          <span className="text-xs text-[var(--text-muted)]">
            {uploading ? "Uploading…" : "Choose image"}
          </span>
        </button>
      )}

      <p className="mt-1.5 text-xs text-[var(--text-muted)]">
        JPEG, PNG, or WebP up to 10 MB.
      </p>

      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
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
