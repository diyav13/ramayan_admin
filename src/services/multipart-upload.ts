import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/api/paths";
import {
  aggregateProgressPercent,
  aggregateUploadedBytes,
  backoffDelayMs,
  CONCURRENCY,
  isMp4File,
  isRetryableHttpStatus,
  MAX_RETRIES,
  orderPartsForComplete,
  PART_SIZE,
  shouldResignOnStatus,
  type VideoUiStatus,
} from "@/services/multipart-upload.helpers";

/**
 * Direct-to-S3 multipart episode video uploader.
 *
 * Flow (bytes never touch our backend):
 *   1. initiate  → CreateMultipartUpload; returns uploadId + sourceKey + part config
 *   2. sign-part → fresh presigned URL shortly before each part PUT
 *   3. PUT parts → browser → S3 (concurrency 3, retries, ETag capture)
 *   4. complete  → CompleteMultipartUpload; S3 then triggers the FFmpeg Lambda
 *   5. return PROCESSING — UI checks status on form open / on demand (no poll loop)
 *
 * Chunk PUTs use XMLHttpRequest for upload.onprogress + ETag access
 * (S3 CORS must ExposeHeaders: ["ETag"]).
 * Conversion can take many minutes; callers must not block the form on READY.
 */

export type { VideoUiStatus };

/** Response from initiate (unwrapped `data`). */
export interface MultipartInitiateResponse {
  episodeId: string;
  uploadId: string;
  sourceKey: string;
  partSize: number;
  concurrency: number;
  maxRetries: number;
  totalParts: number;
}

export interface SignPartResponse {
  partNumber: number;
  uploadUrl: string;
  expiresIn: number;
}

export interface CompletedPart {
  partNumber: number;
  etag: string;
}

export interface MultipartCompleteResponse {
  status: "PROCESSING";
  sourceKey: string;
  expectedOutputs: {
    hlsKey: string;
    thumbnailKey: string;
    fallbackVideoKey: string;
  };
}

export interface VideoStatusResponse {
  status: string;
  ready: boolean;
  playbackUrl?: string | null;
  thumbnailUrl?: string | null;
  fallbackVideoUrl?: string | null;
  processingError?: string | null;
  outputs?: {
    hls: boolean;
    thumbnail: boolean;
    fallbackVideo: boolean;
  };
  processingStartedAt?: string | null;
  processingTimeoutMs?: number;
  suggestedPollIntervalMs?: number;
}

export interface UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  /** 0–100 floor. */
  percent: number;
  uiStatus: VideoUiStatus;
}

export interface VideoUploadResult {
  sourceKey: string;
  videoUrl: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  fallbackVideoUrl?: string;
  status: string;
}

export interface UploadVideoOptions {
  /** Required — backend derives season/episode codes from the episode record. */
  episodeId: string;
  /** Explicit replacement of an existing/active upload. */
  replace?: boolean;
  concurrency?: number;
  maxRetries?: number;
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
}

export class UploadAbortedError extends Error {
  constructor(message = "Upload cancelled") {
    super(message);
    this.name = "UploadAbortedError";
  }
}

export function isUploadAborted(error: unknown): error is UploadAbortedError {
  return error instanceof UploadAbortedError;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortedError());
      return;
    }
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new UploadAbortedError());
    };
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

class HttpUploadError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpUploadError";
    this.status = status;
  }
}

function putChunk(
  url: string,
  body: Blob,
  handlers: { onProgress: (loaded: number) => void; signal?: AbortSignal }
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (handlers.signal?.aborted) {
      reject(new UploadAbortedError());
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);

    const onAbort = () => xhr.abort();
    const cleanup = () => handlers.signal?.removeEventListener("abort", onAbort);
    handlers.signal?.addEventListener("abort", onAbort, { once: true });

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) handlers.onProgress(event.loaded);
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag =
          xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag");
        if (!etag) {
          reject(
            new Error(
              "S3 response did not expose an ETag header. Check the bucket CORS ExposeHeaders policy."
            )
          );
          return;
        }
        resolve(etag);
        return;
      }
      const detail = xhr.responseText?.trim().slice(0, 200);
      reject(
        new HttpUploadError(
          xhr.status,
          detail
            ? `Chunk upload failed (${xhr.status}): ${detail}`
            : `Chunk upload failed (${xhr.status})`
        )
      );
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error("Network error during chunk upload"));
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(new Error("Chunk upload timed out"));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new UploadAbortedError());
    };

    xhr.send(body);
  });
}

async function signPart(
  episodeId: string,
  uploadId: string,
  sourceKey: string,
  partNumber: number
): Promise<string> {
  const signed = await api.post<SignPartResponse>(
    paths.episodes.videoMultipart.signPart(episodeId),
    { uploadId, sourceKey, partNumber }
  );
  if (!signed?.uploadUrl) {
    throw new Error("Sign-part response missing uploadUrl");
  }
  return signed.uploadUrl;
}

async function putChunkWithRetry(
  episodeId: string,
  uploadId: string,
  sourceKey: string,
  partNumber: number,
  body: Blob,
  options: {
    maxRetries: number;
    signal?: AbortSignal;
    onProgress: (loaded: number) => void;
  }
): Promise<string> {
  let attempt = 0;
  let uploadUrl = await signPart(episodeId, uploadId, sourceKey, partNumber);

  for (;;) {
    try {
      return await putChunk(uploadUrl, body, {
        signal: options.signal,
        onProgress: options.onProgress,
      });
    } catch (error) {
      if (isUploadAborted(error) || options.signal?.aborted) {
        throw new UploadAbortedError();
      }

      attempt += 1;
      if (attempt > options.maxRetries) {
        throw error instanceof Error
          ? error
          : new Error("Chunk upload failed after retries");
      }

      const status = error instanceof HttpUploadError ? error.status : 0;
      const retryable =
        status === 0 ||
        isRetryableHttpStatus(status) ||
        shouldResignOnStatus(status);

      if (!retryable) {
        throw error;
      }

      // Reset this part's progress contribution before re-uploading.
      options.onProgress(0);

      if (shouldResignOnStatus(status) || isRetryableHttpStatus(status) || status === 0) {
        uploadUrl = await signPart(episodeId, uploadId, sourceKey, partNumber);
      }

      await delay(backoffDelayMs(attempt), options.signal);
    }
  }
}

async function abortOnServer(
  episodeId: string,
  uploadId: string,
  sourceKey: string
): Promise<void> {
  try {
    await api.post(paths.episodes.videoMultipart.abort(episodeId), {
      uploadId,
      sourceKey,
    });
  } catch {
    // Best-effort — local cancel still wins.
  }
}

/**
 * Upload an episode MP4 via multipart. Returns once S3 assembly succeeds
 * (status PROCESSING). FFmpeg conversion is async — UI checks status on form open.
 */
export async function uploadVideoMultipart(
  file: File,
  options: UploadVideoOptions
): Promise<VideoUploadResult> {
  const {
    episodeId,
    replace: _replace = false,
    concurrency = CONCURRENCY,
    maxRetries = MAX_RETRIES,
    signal,
    onProgress,
  } = options;

  if (!episodeId?.trim()) {
    throw new Error("episodeId is required to upload a video");
  }
  if (!isMp4File(file)) {
    throw new Error("Only MP4 video files are supported");
  }
  if (signal?.aborted) throw new UploadAbortedError();

  onProgress?.({
    uploadedBytes: 0,
    totalBytes: file.size,
    percent: 0,
    uiStatus: "INITIALIZING",
  });

  // Selecting a file always means start/replace this episode's source upload.
  const initiateBody = {
    filename: file.name,
    contentType: "video/mp4" as const,
    fileSize: file.size,
    replace: true,
  };

  let init: MultipartInitiateResponse;
  try {
    init = await api.post<MultipartInitiateResponse>(
      paths.episodes.videoMultipart.initiate(episodeId),
      initiateBody
    );
  } catch (error) {
    const isConflict = error instanceof ApiError && error.status === 409;
    if (!isConflict) throw error;

    // Safety net for race / older servers — force replace again.
    init = await api.post<MultipartInitiateResponse>(
      paths.episodes.videoMultipart.initiate(episodeId),
      { ...initiateBody, replace: true }
    );
  }

  if (!init?.uploadId || !init?.sourceKey) {
    throw new Error("Initiate response missing uploadId or sourceKey");
  }

  const partSize =
    typeof init.partSize === "number" && init.partSize > 0
      ? init.partSize
      : PART_SIZE;
  const totalParts =
    typeof init.totalParts === "number" && init.totalParts > 0
      ? init.totalParts
      : Math.ceil(file.size / partSize);
  const poolConcurrency = Math.min(
    Math.max(1, init.concurrency || concurrency),
    totalParts
  );
  const retries = init.maxRetries || maxRetries;

  const totalBytes = file.size;
  const loadedByPart = new Map<number, number>();
  const completedParts: CompletedPart[] = [];
  const startedParts = new Set<number>();
  let cancelledOnServer = false;

  const report = (uiStatus: VideoUiStatus) => {
    if (!onProgress) return;
    const uploaded = Math.min(
      aggregateUploadedBytes(loadedByPart.values()),
      totalBytes
    );
    onProgress({
      uploadedBytes: uploaded,
      totalBytes,
      percent: aggregateProgressPercent(uploaded, totalBytes),
      uiStatus,
    });
  };

  report("UPLOADING");

  const abortServerIfNeeded = async () => {
    if (cancelledOnServer) return;
    cancelledOnServer = true;
    await abortOnServer(episodeId, init.uploadId, init.sourceKey);
  };

  const onAbortSignal = () => {
    void abortServerIfNeeded();
  };
  signal?.addEventListener("abort", onAbortSignal, { once: true });

  try {
    let nextPart = 1;

    const worker = async (): Promise<void> => {
      for (;;) {
        if (signal?.aborted) throw new UploadAbortedError();

        const partNumber = nextPart;
        nextPart += 1;
        if (partNumber > totalParts) return;
        if (startedParts.has(partNumber)) continue;
        startedParts.add(partNumber);

        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, totalBytes);
        const chunk = file.slice(start, end);
        const chunkSize = end - start;

        const etag = await putChunkWithRetry(
          episodeId,
          init.uploadId,
          init.sourceKey,
          partNumber,
          chunk,
          {
            maxRetries: retries,
            signal,
            onProgress: (loaded) => {
              loadedByPart.set(partNumber, Math.min(loaded, chunkSize));
              report("UPLOADING");
            },
          }
        );

        loadedByPart.set(partNumber, chunkSize);
        report("UPLOADING");
        completedParts.push({ partNumber, etag });
      }
    };

    await Promise.all(
      Array.from({ length: poolConcurrency }, () => worker())
    );

    if (signal?.aborted) throw new UploadAbortedError();

    if (completedParts.length !== totalParts) {
      throw new Error("Upload incomplete — missing part ETags");
    }

    const orderedParts = orderPartsForComplete(completedParts);

    await api.post<MultipartCompleteResponse>(
      paths.episodes.videoMultipart.complete(episodeId),
      {
        uploadId: init.uploadId,
        sourceKey: init.sourceKey,
        parts: orderedParts,
      }
    );

    onProgress?.({
      uploadedBytes: totalBytes,
      totalBytes,
      percent: 100,
      uiStatus: "PROCESSING",
    });

    // Do not wait for READY — conversion can take a long time and must not
    // lock the episode form or spin status requests forever in this call.
    return {
      sourceKey: init.sourceKey,
      videoUrl: "",
      status: "PROCESSING",
    };
  } catch (error) {
    if (isUploadAborted(error) || signal?.aborted) {
      await abortServerIfNeeded();
      onProgress?.({
        uploadedBytes: aggregateUploadedBytes(loadedByPart.values()),
        totalBytes,
        percent: aggregateProgressPercent(
          aggregateUploadedBytes(loadedByPart.values()),
          totalBytes
        ),
        uiStatus: "CANCELLED",
      });
      throw new UploadAbortedError();
    }
    onProgress?.({
      uploadedBytes: aggregateUploadedBytes(loadedByPart.values()),
      totalBytes,
      percent: aggregateProgressPercent(
        aggregateUploadedBytes(loadedByPart.values()),
        totalBytes
      ),
      uiStatus: "FAILED",
    });
    throw error;
  } finally {
    signal?.removeEventListener("abort", onAbortSignal);
  }
}
