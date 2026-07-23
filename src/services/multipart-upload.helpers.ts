/**
 * Pure helpers for the episode video multipart uploader.
 * Kept free of DOM / network so they can be unit-tested in isolation.
 */

export const PART_SIZE = 20 * 1024 * 1024; // 20 MiB
export const CONCURRENCY = 3;
export const MAX_RETRIES = 3;

export type VideoUiStatus =
  | "IDLE"
  | "INITIALIZING"
  | "UPLOADING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "CANCELLED";

export function calculatePartCount(
  fileSize: number,
  partSize: number = PART_SIZE
): number {
  if (!Number.isFinite(fileSize) || fileSize <= 0) return 0;
  if (!Number.isFinite(partSize) || partSize <= 0) return 0;
  return Math.ceil(fileSize / partSize);
}

export function isRetryableHttpStatus(status: number): boolean {
  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

/** True when a fresh signed URL should be requested before retrying. */
export function shouldResignOnStatus(status: number): boolean {
  return status === 403 || status === 401;
}

export function backoffDelayMs(attempt: number): number {
  // attempt is 1-based: 1s, 2s, 4s
  return Math.min(1000 * 2 ** (attempt - 1), 4000);
}

/**
 * Aggregate uploaded bytes across parts. Values are whatever the caller
 * currently attributes to each part (reset to 0 before a retry).
 */
export function aggregateUploadedBytes(
  loadedByPart: Iterable<number>
): number {
  let total = 0;
  for (const value of loadedByPart) {
    total += Math.max(0, value);
  }
  return total;
}

export function aggregateProgressPercent(
  uploadedBytes: number,
  totalBytes: number
): number {
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) return 0;
  const clamped = Math.min(Math.max(0, uploadedBytes), totalBytes);
  return Math.floor((clamped / totalBytes) * 100);
}

export function statusLabel(
  status: VideoUiStatus,
  percent?: number
): string {
  switch (status) {
    case "INITIALIZING":
      return "Preparing upload…";
    case "UPLOADING":
      return `Uploading video — ${percent ?? 0}%`;
    case "PROCESSING":
      return "Upload complete. Converting on the server — reopen edit or tap Check status when ready.";
    case "READY":
      return "";
    case "FAILED":
      return "Video upload failed.";
    case "CANCELLED":
      return "Upload cancelled.";
    default:
      return "";
  }
}

export function isMp4File(file: { name: string; type: string }): boolean {
  const nameOk = /\.mp4$/i.test(file.name.trim());
  const typeOk =
    !file.type ||
    file.type === "video/mp4" ||
    file.type === "application/mp4";
  return nameOk && typeOk;
}

export function orderPartsForComplete<T extends { partNumber: number }>(
  parts: T[]
): T[] {
  return [...parts].sort((a, b) => a.partNumber - b.partNumber);
}
