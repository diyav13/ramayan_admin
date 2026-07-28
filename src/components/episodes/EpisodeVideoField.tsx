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
import { isMp4File, statusLabel } from "@/services/multipart-upload.helpers";

type EpisodeVideoFieldProps = {
  value: string;
  onChange: (url: string) => void;
  /** Required for multipart upload — save the episode first when creating. */
  episodeId?: string;
  /** Optional seed from list/detail — avoids status API on form open. */
  initialUploadStatus?: string | null;
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

/** True when the browser can play this URL without an HLS.js-style player. */
function canNativePlay(url: string): boolean {
  if (!url.trim()) return false;
  if (url.startsWith("blob:")) return true;
  if (!isHlsUrl(url)) return true;
  if (typeof document === "undefined") return false;
  const probe = document.createElement("video");
  return Boolean(probe.canPlayType("application/vnd.apple.mpegurl"));
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
 *
 * After bytes land in S3, conversion runs server-side. Edit uses list payload
 * (videoUrl / videoUploadStatus); status is only fetched on demand via
 * "Check status" — never on form open, never polled in a loop.
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
  const statusAbortRef = useRef<AbortController | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [percent, setPercent] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uiStatus, setUiStatus] = useState<VideoUiStatus>(() =>
    mapServerStatus(initialUploadStatus)
  );
  const [serverStatus, setServerStatus] = useState<string | null>(
    initialUploadStatus ?? null
  );
  const [outputHints, setOutputHints] = useState<string | null>(null);
  const [statusThumbnailUrl, setStatusThumbnailUrl] = useState<string | null>(
    null
  );
  const [statusFallbackUrl, setStatusFallbackUrl] = useState<string | null>(
    null
  );

  const canUpload = Boolean(episodeId?.trim());
  /** Only active byte transfer locks the picker / shows the dense progress bar. */
  const showUploadProgress =
    uploading ||
    uiStatus === "INITIALIZING" ||
    uiStatus === "UPLOADING";
  const isProcessing = uiStatus === "PROCESSING" && !showUploadProgress;

  const playableUrl = (() => {
    if (localPreview) return localPreview;
    const fallback = statusFallbackUrl?.trim();
    if (fallback && canNativePlay(fallback)) return fallback;
    const primary = value?.trim();
    if (primary && canNativePlay(primary)) return primary;
    return null;
  })();

  const hasVideoAsset =
    Boolean(playableUrl) ||
    Boolean(value?.trim()) ||
    Boolean(statusThumbnailUrl) ||
    isProcessing ||
    uiStatus === "READY" ||
    serverStatus === "READY" ||
    serverStatus === "PROCESSING" ||
    serverStatus === "UPLOADED";

  useEffect(() => {
    // PROCESSING must not disable Save — conversion can take a long time.
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      statusAbortRef.current?.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function applyStatusMedia(status: VideoStatusResponse) {
    const thumb = status.thumbnailUrl?.trim() || null;
    const fallback = status.fallbackVideoUrl?.trim() || null;
    if (thumb) setStatusThumbnailUrl(thumb);
    if (fallback) setStatusFallbackUrl(fallback);
  }

  function applyTerminalStatus(status: VideoStatusResponse) {
    setServerStatus(status.status);
    applyStatusMedia(status);
    if (status.ready || status.status === "READY") {
      const url = status.playbackUrl?.trim();
      if (url && url !== valueRef.current) onChange(url);
      setUiStatus("READY");
      setError(null);
      setOutputHints(null);
      setUploading(false);
      return;
    }
    if (status.status === "FAILED" || status.status === "CANCELLED") {
      setUiStatus(status.status === "CANCELLED" ? "CANCELLED" : "FAILED");
      setUploading(false);
      setOutputHints(null);
      setError(
        status.processingError?.trim() ||
          (status.status === "CANCELLED"
            ? "Upload cancelled."
            : "Previous video upload/processing failed. Retry with a new MP4.")
      );
    }
  }

  function applyProcessingHints(status: VideoStatusResponse) {
    const outputs = status.outputs;
    if (!outputs) {
      setOutputHints("Waiting for converter outputs…");
      return;
    }
    const parts = [
      outputs.hls ? "HLS" : null,
      outputs.thumbnail ? "thumb" : null,
      outputs.fallbackVideo ? "fallback" : null,
    ].filter(Boolean);
    setOutputHints(
      parts.length > 0
        ? `Outputs ready: ${parts.join(", ")}`
        : "Waiting for converter outputs…"
    );
  }

  /** One-shot status fetch — used on form open and manual refresh only. */
  async function fetchVideoStatus(options?: {
    showChecking?: boolean;
    signal?: AbortSignal;
  }): Promise<void> {
    if (!episodeId?.trim() || uploadingLockRef.current) return;

    const signal = options?.signal;
    if (options?.showChecking) setCheckingStatus(true);

    try {
      const status = await api.get<VideoStatusResponse>(
        paths.episodes.videoStatus(episodeId)
      );
      if (signal?.aborted || uploadingLockRef.current) return;

      setServerStatus(status.status);
      setUiStatus(mapServerStatus(status.status));
      applyStatusMedia(status);

      if (status.ready || status.status === "READY") {
        applyTerminalStatus(status);
        return;
      }

      if (status.status === "FAILED" || status.status === "CANCELLED") {
        applyTerminalStatus(status);
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
        setUploading(false);
        setUiStatus("PROCESSING");
        applyProcessingHints(status);
      }
    } catch (err) {
      if (signal?.aborted) return;
      if (options?.showChecking) {
        setError(
          getErrorMessage(
            err,
            "Could not check video status. Conversion may still finish — try again later."
          )
        );
      }
      // On form open, status fetch failure is non-fatal.
    } finally {
      if (options?.showChecking) setCheckingStatus(false);
    }
  }

  // Bind preview source only when the browser can play it natively.
  useEffect(() => {
    const video = videoRef.current;
    const url = playableUrl;
    if (!video) return;

    if (!url) {
      video.removeAttribute("src");
      video.load();
      return;
    }

    video.src = url;
  }, [playableUrl]);

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
    statusAbortRef.current?.abort();
    setError(null);
    setOutputHints(null);
    setStatusThumbnailUrl(null);
    setStatusFallbackUrl(null);
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
      setPercent(100);
      setServerStatus(result.status);
      setUiStatus(mapServerStatus(result.status));

      if (result.status === "READY") {
        const url = result.playbackUrl?.trim() || result.videoUrl?.trim();
        if (url) onChange(url);
        setError(null);
      } else {
        // Upload finished; conversion continues server-side — no poll loop.
        setOutputHints("Waiting for converter outputs…");
      }
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
    if (uploading) return;
    videoRef.current?.pause();
    setIsPlaying(false);
    revokeLocalPreview();
    setError(null);
    setOutputHints(null);
    setStatusThumbnailUrl(null);
    setStatusFallbackUrl(null);
    setUiStatus("IDLE");
    setServerStatus(null);
    onChange("");
  }

  function openPicker() {
    if (uploading || !canUpload) return;
    inputRef.current?.click();
  }

  async function handlePlay() {
    const video = videoRef.current;
    if (!video || !playableUrl) return;

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

  const showPlayablePreview = Boolean(playableUrl);
  const showVideoPlaceholder = hasVideoAsset && !showPlayablePreview;

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

      {showPlayablePreview ? (
        <div className="relative w-fit">
          <video
            ref={videoRef}
            className={`${previewClass} ${
              showUploadProgress ? "opacity-60" : isPlaying ? "" : "cursor-pointer"
            }`}
            playsInline
            preload="metadata"
            poster={statusThumbnailUrl ?? undefined}
            controls={isPlaying && !showUploadProgress}
            onClick={() => {
              if (!showUploadProgress && !isPlaying) void handlePlay();
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          {showUploadProgress ? (
            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/45 px-1 text-center text-[10px] font-medium leading-tight text-white">
              {uiStatus === "INITIALIZING"
                ? "Preparing…"
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

          {!showUploadProgress ? (
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
      ) : showVideoPlaceholder ? (
        <div className="relative w-fit">
          <div
            className={`${previewClass} relative flex items-center justify-center overflow-hidden`}
            aria-label={
              isProcessing
                ? "Video processing"
                : "Video attached — preview not available in this browser"
            }
          >
            {statusThumbnailUrl ? (
              <img
                src={statusThumbnailUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-black/40" />
            <PlayIcon />
            {showUploadProgress ? (
              <div className="absolute inset-0 flex items-center justify-center rounded bg-black/45 px-1 text-center text-[10px] font-medium leading-tight text-white">
                {uiStatus === "INITIALIZING"
                  ? "Preparing…"
                  : `${Math.round(percent)}%`}
              </div>
            ) : null}
          </div>
          {!showUploadProgress ? (
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

      {showUploadProgress ? (
        <div className="mt-2 w-full max-w-sm">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={
              uiStatus === "INITIALIZING" ? 0 : Math.round(percent)
            }
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--gold)] transition-[width] duration-200 ease-out"
              style={{
                width: `${uiStatus === "INITIALIZING" ? 8 : percent}%`,
              }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span>
              {totalBytes > 0
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
      ) : isProcessing ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-amber-300/90">{statusLabel("PROCESSING")}</p>
          {outputHints ? (
            <p className="text-xs text-[var(--text-muted)]">{outputHints}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void fetchVideoStatus({ showChecking: true })}
              disabled={!canUpload || checkingStatus}
              className="text-xs text-[var(--gold)] underline-offset-2 outline-none hover:underline disabled:opacity-60"
            >
              {checkingStatus ? "Checking…" : "Check status"}
            </button>
            <button
              type="button"
              onClick={openPicker}
              disabled={!canUpload || checkingStatus}
              className="text-xs text-[var(--gold)] underline-offset-2 outline-none hover:underline disabled:opacity-60"
            >
              Replace video
            </button>
          </div>
        </div>
      ) : showVideoPlaceholder && value?.trim() && isHlsUrl(value) ? (
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          Video is attached. Preview needs Safari or a fallback MP4.
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          {canUpload
            ? "MP4 only — uploaded directly to storage in 20 MB chunks."
            : "Create and save the episode first, then upload the MP4 video."}
        </p>
      )}

      {(uiStatus === "FAILED" || uiStatus === "CANCELLED") &&
      !showUploadProgress ? (
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
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-white drop-shadow"
    >
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-[var(--text-muted)]"
    >
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}
