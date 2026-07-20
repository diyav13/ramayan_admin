"use client";

import { ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { Field } from "@/components/ui/Field";
import { getErrorMessage } from "@/lib/api/errors";
import { uploadService } from "@/services/uploads";

type EpisodeThumbnailFieldProps = {
  value: string;
  onChange: (url: string) => void;
  /** Pass when editing an existing episode so uploads land under that episode folder. */
  episodeId?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

const previewClass =
  "h-24 w-36 shrink-0 rounded bg-[var(--surface)] object-cover ring-1 ring-white/10";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Episode thumbnail picker — presigned PUT to S3, then stores the public URL.
 * Local blob previews stay in this component; parent state only gets S3 URLs.
 */
export function EpisodeThumbnailField({
  value,
  onChange,
  episodeId,
  onUploadingChange,
}: EpisodeThumbnailFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const displayUrl = localPreview ?? value;

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

    // #region agent log
    console.log("[thumb-debug] file selected (local preview only)", {
      name: file.name,
      type: file.type,
      size: file.size,
      episodeId,
      parentValue: value,
    });
    fetch('http://127.0.0.1:7575/ingest/74428e7d-57d1-4707-9993-faa512483745',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'98511f'},body:JSON.stringify({sessionId:'98511f',runId:'post-fix',location:'EpisodeThumbnailField.tsx:handleFileChange',message:'file selected',data:{fileName:file.name,contentType:file.type,size:file.size,episodeId,parentValue:value||null},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    setUploading(true);

    try {
      const publicUrl = await uploadService.episodeThumbnail(file, episodeId);
      revokeLocalPreview();
      onChange(publicUrl);
      // #region agent log
      console.log("[thumb-debug] upload success, parent updated", { publicUrl });
      fetch('http://127.0.0.1:7575/ingest/74428e7d-57d1-4707-9993-faa512483745',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'98511f'},body:JSON.stringify({sessionId:'98511f',runId:'post-fix',location:'EpisodeThumbnailField.tsx:handleFileChange',message:'upload success',data:{publicUrl},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (err) {
      revokeLocalPreview();
      const errMsg = getErrorMessage(err, "Thumbnail upload failed");
      setError(errMsg);
      // #region agent log
      console.error("[thumb-debug] upload failed", err);
      fetch('http://127.0.0.1:7575/ingest/74428e7d-57d1-4707-9993-faa512483745',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'98511f'},body:JSON.stringify({sessionId:'98511f',runId:'post-fix',location:'EpisodeThumbnailField.tsx:handleFileChange',message:'upload failed',data:{error:errMsg,parentValue:value||null},timestamp:Date.now(),hypothesisId:'A,B'})}).catch(()=>{});
      // #endregion
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
    <Field label="Thumbnail" htmlFor={inputId}>
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
            alt="Episode thumbnail"
            className={`${previewClass} ${uploading ? "opacity-60" : ""}`}
          />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40 text-xs text-white">
              Uploading…
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Remove thumbnail"
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
          className="flex h-24 w-36 flex-col items-center justify-center gap-1.5 rounded border border-dashed border-white/15 bg-[var(--surface)] text-center outline-none transition hover:border-white/25 hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:opacity-60"
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
