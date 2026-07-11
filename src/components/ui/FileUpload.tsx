"use client";

import { ChangeEvent, useId, useRef, useState } from "react";
import { Field } from "./Field";
import { getErrorMessage } from "@/lib/api/errors";

type FileUploadProps = {
  label: string;
  accept: string;
  kind: "image" | "video";
  value?: string | null;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  hint?: string;
};

export function FileUpload({
  label,
  accept,
  kind,
  value,
  onChange,
  onUpload,
  hint,
}: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    setFileName(file.name);

    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed"));
      setFileName(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    onChange("");
    setFileName(null);
    setError(null);
  }

  return (
    <Field label={label} htmlFor={inputId}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {kind === "image" && value ? (
            <img
              src={value}
              alt=""
              className="size-16 rounded-md object-cover ring-1 ring-white/10"
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(event) => void handleFileChange(event)}
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded border border-white/10 bg-[var(--surface)] px-3 py-2 text-sm text-white transition hover:bg-white/5 disabled:opacity-60"
            >
              {uploading
                ? "Uploading…"
                : value
                  ? "Replace file"
                  : "Choose file"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="text-sm text-[var(--text-muted)] transition hover:text-white disabled:opacity-60"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>

        {fileName ? (
          <p className="text-xs text-[var(--text-muted)]">{fileName}</p>
        ) : value && kind === "video" ? (
          <p className="truncate text-xs text-[var(--text-muted)]">{value}</p>
        ) : null}

        {hint ? <p className="text-xs text-[var(--text-muted)]">{hint}</p> : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    </Field>
  );
}
