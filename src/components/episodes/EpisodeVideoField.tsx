"use client";

import { ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { Field } from "@/components/ui/Field";
import { getErrorMessage } from "@/lib/api/errors";
import { uploadService } from "@/services/uploads";
import {
  isUploadAborted,
  type VideoUiStatus,
} from "@/services/multipart-upload";
import {
  isMp4File,
  statusLabel,
} from "@/services/multipart-upload.helpers";

type EpisodeVideoFieldProps = {
  value: string;
  onChange: (url: string) => void;
  /** Required for multipart upload — save the episode first when creating. */
  episodeId?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

const previewClass =
  "h-24 w-36 shrink-0 rounded bg-[var(--surface)] object-cover ring-1 ring-white/10";

/** Matches backend VIDEO_MAX_UPLOAD_SIZE_MB default (1024). */
const MAX_BYTES = 1024 * 1024 * 1024;

const REPLACE_MESSAGE =
  "Replacing this video will upload a new source file and start processing again. Existing processed playback may remain available until the new video is ready.";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}

/**
 * Episode video picker — resilient direct-to-S3 multipart upload.
 *
 * Requires a saved episodeId. Parent receives the CloudFront HLS URL only after
 * processing reaches READY. Local object URLs are used for in-browser preview
 * of the selected source file during upload.
 *
 * HLS preview uses native playback where supported (Safari/iOS). Other browsers
 * may not preview `.m3u8` in-admin; the mobile app player remains the primary
 * playback surface. Install `hls.js` later if admin Chrome preview is required.
 */
export function EpisodeVideoField({
  value,
  onChange,
  episodeId,
  onUploadingChange,
}: EpisodeVideoFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const uploadingLockRef = useRef(false);

  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uiStatus, setUiStatus] = useState<VideoUiStatus>("IDLE");

  const displayUrl = localPreview ?? value;
  const canUpload = Boolean(episodeId?.trim());

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Bind preview source. Native HLS works in Safari; other browsers may not play m3u8.
  useEffect(() => {
    const video = videoRef.current;
    const url = displayUrl;
    if (!video) return;

    if (!url) {
      video.removeAttribute("src");
      video.load();
      return;
    }

    if (url.startsWith("blob:") || !isHlsUrl(url)) {
      video.src = url;
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return;
    }

    // Keep the master playlist URL as the stored value; preview may be limited.
    video.src = url;
  }, [displayUrl]);

  function revokeLocalPreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalPreview(null);
  }

  async function startUpload(file: File, replace: boolean) {
    if (!episodeId?.trim() || uploadingLockRef.current) return;

    uploadingLockRef.current = true;
    setError(null);
    setIsPlaying(false);

    revokeLocalPreview();
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    setLocalPreview(localUrl);

    const controller = new AbortController();
    abortRef.current = controller;

    setUploading(true);
    setUiStatus("INITIALIZING");
    setPercent(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);

    try {
      const result = await uploadService.videoMultipart(file, {
        episodeId,
        replace,
        signal: controller.signal,
        onProgress: ({
          percent: pct,
          uploadedBytes: done,
          totalBytes: total,
          uiStatus: status,
        }) => {
          setPercent(pct);
          setUploadedBytes(done);
          setTotalBytes(total);
          setUiStatus(status);
        },
      });
      revokeLocalPreview();
      onChange(result.videoUrl);
      setUiStatus("READY");
    } catch (err) {
      if (isUploadAborted(err)) {
        setUiStatus("CANCELLED");
        revokeLocalPreview();
      } else {
        setUiStatus("FAILED");
        setError(getErrorMessage(err, "Video upload failed"));
        revokeLocalPreview();
      }
    } finally {
      abortRef.current = null;
      setUploading(false);
      uploadingLockRef.current = false;
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    event.target.blur();
    if (!file) return;

    if (!canUpload) {
      setError("Save the episode first, then upload the video.");
      return;
    }

    if (!isMp4File(file)) {
      setError("Please choose an MP4 video file.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError(`Video must be ${formatBytes(MAX_BYTES)} or smaller.`);
      return;
    }

    const replacing = Boolean(value?.trim());
    if (replacing && !window.confirm(REPLACE_MESSAGE)) {
      return;
    }

    await startUpload(file, replacing);
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  function handleRemove() {
    if (uploading) return;
    videoRef.current?.pause();
    setIsPlaying(false);
    revokeLocalPreview();
    setError(null);
    setUiStatus("IDLE");
    onChange("");
  }

  function openPicker() {
    if (uploading || !canUpload) return;
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

  const progressText =
    uiStatus === "UPLOADING"
      ? statusLabel("UPLOADING", Math.round(percent))
      : statusLabel(uiStatus);

  return (
    <Field label="Video" htmlFor={inputId}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="video/mp4"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
        disabled={uploading || !canUpload}
      />

      {displayUrl ? (
        <div className="relative w-fit">
          <video
            ref={videoRef}
            className={`${previewClass} ${
              uploading ? "opacity-60" : isPlaying ? "" : "cursor-pointer"
            }`}
            playsInline
            preload="metadata"
            controls={isPlaying && !uploading}
            onClick={() => {
              if (!uploading && !isPlaying) void handlePlay();
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/45 px-1 text-center text-[10px] font-medium leading-tight text-white">
              {uiStatus === "PROCESSING"
                ? "Processing…"
                : `${Math.round(percent)}%`}
            </div>
          ) : !isPlaying ? (
            <button
              type="button"
              onClick={() => void handlePlay()}
              aria-label="Play video"
              className="absolute inset-0 flex items-center justify-center rounded bg-black/35 outline-none transition hover:bg-black/45 focus-visible:ring-1 focus-visible:ring-[var(--gold)]"
            >
              <PlayIcon />
            </button>
          ) : null}

          {!uploading ? (
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove video"
              className="absolute -right-2 -top-2 z-10 flex size-6 items-center justify-center rounded-full border border-white/15 bg-[var(--surface)] text-[var(--text-muted)] outline-none transition hover:bg-red-500/20 hover:text-red-300"
            >
              <CrossIcon />
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading || !canUpload}
          className="flex h-24 w-36 flex-col items-center justify-center gap-1.5 rounded border border-dashed border-white/15 bg-[var(--surface)] text-center outline-none transition hover:border-white/25 hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:opacity-60"
        >
          <VideoIcon />
          <span className="text-xs text-[var(--text-muted)]">
            {canUpload ? "Choose video" : "Save first"}
          </span>
        </button>
      )}

      {uploading ? (
        <div className="mt-2 w-full max-w-sm">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--gold)] transition-[width] duration-200 ease-out"
              style={{
                width: `${uiStatus === "PROCESSING" ? 100 : percent}%`,
              }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span>
              {uiStatus === "PROCESSING" || uiStatus === "INITIALIZING"
                ? progressText
                : `${formatBytes(uploadedBytes)} / ${formatBytes(totalBytes)}`}
            </span>
            {uiStatus === "UPLOADING" || uiStatus === "INITIALIZING" ? (
              <button
                type="button"
                onClick={handleCancel}
                className="shrink-0 text-[var(--text-muted)] underline-offset-2 outline-none transition hover:text-red-300 hover:underline focus-visible:text-red-300"
              >
                Cancel
              </button>
            ) : null}
          </div>
          {uiStatus === "UPLOADING" ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">{progressText}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          {canUpload
            ? "MP4 only — uploaded directly to storage in 20 MB chunks."
            : "Create and save the episode first, then upload the MP4 video."}
        </p>
      )}

      {uiStatus === "READY" && !uploading && value ? (
        <p className="mt-1 text-xs text-emerald-400/90">{statusLabel("READY")}</p>
      ) : null}

      {uiStatus === "FAILED" && !uploading ? (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openPicker}
            disabled={!canUpload}
            className="text-xs text-[var(--gold)] underline-offset-2 outline-none hover:underline"
          >
            Retry / Replace
          </button>
        </div>
      ) : null}

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
