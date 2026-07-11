"use client";

import { ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { Field } from "@/components/ui/Field";

type EpisodeVideoFieldProps = {
  value: string;
  onChange: (url: string) => void;
};

const previewClass =
  "h-24 w-36 shrink-0 rounded bg-[var(--surface)] object-cover ring-1 ring-white/10";

/**
 * Episode video picker.
 * Upload API is temporarily disabled — selected files use a local object URL for preview.
 */
export function EpisodeVideoField({ value, onChange }: EpisodeVideoFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

    if (!file.type.startsWith("video/")) {
      setError("Please choose a video file.");
      return;
    }

    setError(null);
    setIsPlaying(false);

    // Temporary: skip video upload API and preview locally.
    // const url = await uploadService.video(file);
    revokeLocalPreview();
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    onChange(localUrl);
  }

  function handleRemove() {
    videoRef.current?.pause();
    setIsPlaying(false);
    revokeLocalPreview();
    setError(null);
    onChange("");
  }

  function openPicker() {
    inputRef.current?.click();
  }

  async function handlePlay() {
    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setError("Unable to play this video.");
    }
  }

  return (
    <Field label="Video" htmlFor={inputId}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="sr-only"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="relative w-fit">
          <video
            ref={videoRef}
            src={value}
            className={`${previewClass} ${isPlaying ? "" : "cursor-pointer"}`}
            playsInline
            preload="metadata"
            controls={isPlaying}
            onClick={() => {
              if (!isPlaying) void handlePlay();
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          {!isPlaying ? (
            <button
              type="button"
              onClick={() => void handlePlay()}
              aria-label="Play video"
              className="absolute inset-0 flex items-center justify-center rounded bg-black/35 outline-none transition hover:bg-black/45 focus-visible:ring-1 focus-visible:ring-[var(--gold)]"
            >
              <PlayIcon />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove video"
            className="absolute -right-2 -top-2 z-10 flex size-6 items-center justify-center rounded-full border border-white/15 bg-[var(--surface)] text-[var(--text-muted)] outline-none transition hover:bg-red-500/20 hover:text-red-300"
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
          <VideoIcon />
          <span className="text-xs text-[var(--text-muted)]">Choose video</span>
        </button>
      )}

      <p className="mt-1.5 text-xs text-[var(--text-muted)]">
        MP4, WebM, or MOV up to 50 MB.
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

function PlayIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-white/95"
    >
      <path d="M8 5.14v14.72a1 1 0 0 0 1.5.86l11.04-7.36a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function VideoIcon() {
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
      <path d="m16 13 5.223-3.482A.5.5 0 0 1 22 9.87v4.26a.5.5 0 0 1-.777.416L16 11.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  );
}
