"use client";

import { ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { Field } from "@/components/ui/Field";
import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { getErrorMessage } from "@/lib/api/errors";
import { uploadService } from "@/services/uploads";
import {
  isUploadAborted,
  type VideoStatusResponse,
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
  /** Optional seed from episode detail (avoids a flash before status fetch). */
  initialUploadStatus?: string | null;
  onUploadingChange?: (uploading: boolean) => void;
};

const previewClass =
  "h-24 w-36 shrink-0 rounded bg-[var(--surface)] object-cover ring-1 ring-white/10";

/** Matches backend VIDEO_MAX_UPLOAD_SIZE_MB default (1024). */
const MAX_BYTES = 1024 * 1024 * 1024;
const STATUS_POLL_MS = 4000;

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

function mapServerStatus(status: string | null | undefined): VideoUiStatus {
  switch (status) {
    case "INITIALIZING":
      return "INITIALIZING";
    case "UPLOADING":
    case "UPLOADED":
      return "UPLOADING";
    case "PROCESSING":
      return "PROCESSING";
    case "READY":
      return "READY";
    case "FAILED":
      return "FAILED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "IDLE";
  }
}

/**
 * Episode video picker — resilient direct-to-S3 multipart upload.
 *
 * Requires a saved episodeId. Parent receives the CloudFront HLS URL only after
 * processing reaches READY. Local object URLs are used for in-browser preview
 * of the selected source file during upload.
 */
export function EpisodeVideoField({
  value,
  onChange,
  episodeId,
  initialUploadStatus,
  onUploadingChange,
}: EpisodeVideoFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const uploadingLockRef = useRef(false);
  const pollAbortRef = useRef<AbortController | null>(null);

  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uiStatus, setUiStatus] = useState<VideoUiStatus>(() =>
    mapServerStatus(initialUploadStatus)
  );
  const [serverStatus, setServerStatus] = useState<string | null>(
    initialUploadStatus ?? null
  );

  const displayUrl = localPreview ?? value;
  const canUpload = Boolean(episodeId?.trim());
  const showProgress =
    uploading ||
    uiStatus === "PROCESSING" ||
    uiStatus === "INITIALIZING" ||
    uiStatus === "UPLOADING";

  useEffect(() => {
    onUploadingChange?.(uploading || uiStatus === "PROCESSING");
  }, [uploading, uiStatus, onUploadingChange]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      pollAbortRef.current?.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Hydrate / resume from server status when editing an episode.
  useEffect(() => {
    if (!episodeId?.trim() || uploadingLockRef.current) return;

    let cancelled = false;
    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;

    async function hydrate() {
      try {
        const status = await api.get<VideoStatusResponse>(
          paths.episodes.videoStatus(episodeId!)
        );
        if (cancelled || controller.signal.aborted) return;

        setServerStatus(status.status);
        const mapped = mapServerStatus(status.status);
        setUiStatus(mapped);

        if (status.ready || status.status === "READY") {
          const url = status.playbackUrl?.trim();
          if (url && url !== value) onChange(url);
          setError(null);
          return;
        }

        if (status.status === "FAILED") {
          setError(
            status.processingError?.trim() ||
              "Previous video upload/processing failed. Retry with a new MP4."
          );
          return;
        }

        if (
          status.status === "UPLOADING" ||
          status.status === "INITIALIZING" ||
          status.status === "UPLOADED"
        ) {
          setError(
            "A previous upload was interrupted. Choose the MP4 again to resume with a fresh upload."
          );
          return;
        }

        if (status.status === "PROCESSING") {
          setError(null);
          setUploading(true);
          setPercent(100);
          setUiStatus("PROCESSING");
          await pollProcessing(controller.signal);
        }
      } catch {
        // Non-fatal — form still works for a fresh pick.
      }
    }

    async function pollProcessing(signal: AbortSignal) {
      while (!signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, STATUS_POLL_MS));
        if (signal.aborted) return;
        try {
          const status = await api.get<VideoStatusResponse>(
            paths.episodes.videoStatus(episodeId!)
          );
          if (signal.aborted) return;
          setServerStatus(status.status);

          if (status.ready || status.status === "READY") {
            const url = status.playbackUrl?.trim();
            if (url) onChange(url);
            setUiStatus("READY");
            setUploading(false);
            setError(null);
            return;
          }

          if (status.status === "FAILED") {
            setUiStatus("FAILED");
            setUploading(false);
            setError(
              status.processingError?.trim() || "Video processing failed"
            );
            return;
          }

          setUiStatus("PROCESSING");
        } catch (err) {
          if (signal.aborted) return;
          setUploading(false);
          setUiStatus("FAILED");
          setError(getErrorMessage(err, "Failed to check video status"));
          return;
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // Only re-hydrate when the episode changes — not on every value update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

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

    video.src = url;
  }, [displayUrl]);

  function revokeLocalPreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalPreview(null);
  }

  async function startUpload(file: File) {
    if (!episodeId?.trim() || uploadingLockRef.current) return;

    uploadingLockRef.current = true;
    pollAbortRef.current?.abort();
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
        replace: true,
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
      setServerStatus("READY");
      setUiStatus("READY");
      setPercent(100);
    } catch (err) {
      if (isUploadAborted(err)) {
        setUiStatus("CANCELLED");
        setServerStatus("CANCELLED");
        revokeLocalPreview();
      } else {
        setUiStatus("FAILED");
        setServerStatus("FAILED");
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

    const hasExistingPlayback = Boolean(value?.trim());
    const hasServerWork =
      serverStatus === "READY" ||
      serverStatus === "PROCESSING" ||
      serverStatus === "UPLOADING" ||
      serverStatus === "INITIALIZING" ||
      serverStatus === "UPLOADED" ||
      uiStatus === "FAILED";

    if ((hasExistingPlayback || hasServerWork) && !window.confirm(REPLACE_MESSAGE)) {
      return;
    }

    await startUpload(file);
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  function handleRemove() {
    if (uploading || uiStatus === "PROCESSING") return;
    videoRef.current?.pause();
    setIsPlaying(false);
    revokeLocalPreview();
    setError(null);
    setUiStatus("IDLE");
    setServerStatus(null);
    onChange("");
  }

  function openPicker() {
    if (uploading || uiStatus === "PROCESSING" || !canUpload) return;
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
        disabled={uploading || uiStatus === "PROCESSING" || !canUpload}
      />

      {displayUrl ? (
        <div className="relative w-fit">
          <video
            ref={videoRef}
            className={`${previewClass} ${
              showProgress ? "opacity-60" : isPlaying ? "" : "cursor-pointer"
            }`}
            playsInline
            preload="metadata"
            controls={isPlaying && !showProgress}
            onClick={() => {
              if (!showProgress && !isPlaying) void handlePlay();
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          {showProgress ? (
            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/45 px-1 text-center text-[10px] font-medium leading-tight text-white">
              {uiStatus === "PROCESSING" || uiStatus === "INITIALIZING"
                ? uiStatus === "PROCESSING"
                  ? "Processing…"
                  : "Preparing…"
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

          {!showProgress ? (
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
          disabled={uploading || uiStatus === "PROCESSING" || !canUpload}
          className="flex h-24 w-36 flex-col items-center justify-center gap-1.5 rounded border border-dashed border-white/15 bg-[var(--surface)] text-center outline-none transition hover:border-white/25 hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:opacity-60"
        >
          <VideoIcon />
          <span className="text-xs text-[var(--text-muted)]">
            {canUpload ? "Choose video" : "Save first"}
          </span>
        </button>
      )}

      {showProgress ? (
        <div className="mt-2 w-full max-w-sm">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={
              uiStatus === "PROCESSING" || uiStatus === "INITIALIZING"
                ? 100
                : Math.round(percent)
            }
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--gold)] transition-[width] duration-200 ease-out"
              style={{
                width: `${
                  uiStatus === "PROCESSING" || uiStatus === "INITIALIZING"
                    ? 100
                    : percent
                }%`,
              }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span>
              {uiStatus === "PROCESSING" || uiStatus === "INITIALIZING"
                ? progressText
                : totalBytes > 0
                  ? `${formatBytes(uploadedBytes)} / ${formatBytes(totalBytes)}`
                  : progressText}
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

      {uiStatus === "READY" && !showProgress && value ? (
        <p className="mt-1 text-xs text-emerald-400/90">{statusLabel("READY")}</p>
      ) : null}

      {(uiStatus === "FAILED" || uiStatus === "CANCELLED") && !showProgress ? (
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
