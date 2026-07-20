import { getApiBaseUrl } from "@/lib/api/config";
import { unwrapApiResponse } from "@/lib/api/response";
import type { EpisodeThumbnailUploadUrlResponse } from "@/types/episode";

type PresignPayload = EpisodeThumbnailUploadUrlResponse & { url?: string };

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

/** Must match `getUploadSignedUrl` in ramayana-server `src/utils/s3.ts`. */
const EPISODE_THUMBNAIL_CACHE_CONTROL =
  "public, max-age=31536000, immutable";

function resolveContentType(file: File): string {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  const byExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return byExt[ext ?? ""] ?? "application/octet-stream";
}

function buildS3UploadHeaders(
  presignHeaders: Record<string, string> | undefined,
  contentType: string
): Record<string, string> {
  const pick = (name: string) =>
    presignHeaders?.[name] ?? presignHeaders?.[name.toLowerCase()];

  return {
    "Content-Type": pick("Content-Type") ?? contentType,
    "Cache-Control": pick("Cache-Control") ?? EPISODE_THUMBNAIL_CACHE_CONTROL,
  };
}

export function validateEpisodeThumbnailFile(file: File): string | null {
  const contentType = resolveContentType(file);
  if (!ALLOWED_TYPES.has(contentType)) {
    return "Thumbnail must be JPEG, PNG, or WebP.";
  }
  if (file.size > MAX_BYTES) {
    return "Thumbnail must be 10 MB or smaller.";
  }
  return null;
}

function resolvePresignUrls(presign: PresignPayload): {
  uploadUrl: string;
  publicUrl: string;
  headers?: Record<string, string>;
} {
  const uploadUrl = presign.uploadUrl?.trim();
  const publicUrl = (presign.publicUrl ?? presign.url)?.trim();

  if (!uploadUrl) {
    throw new Error("Presign response missing uploadUrl");
  }
  if (!publicUrl) {
    throw new Error("Presign response missing publicUrl");
  }

  return { uploadUrl, publicUrl, headers: presign.headers };
}

/** Presign on the backend, then PUT bytes to S3 from the server (avoids browser CORS). */
export async function uploadEpisodeThumbnailViaPresign(
  file: File,
  authorization: string | null,
  episodeId?: string
): Promise<string> {
  const validationError = validateEpisodeThumbnailFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const contentType = resolveContentType(file);

  const presignResponse = await fetch(
    `${getApiBaseUrl()}/episodes/thumbnail/upload-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType,
        ...(episodeId ? { episodeId } : {}),
      }),
    }
  );

  const presignBody = await presignResponse.json().catch(() => null);

  if (!presignResponse.ok) {
    const message =
      typeof presignBody === "object" &&
      presignBody !== null &&
      "message" in presignBody &&
      typeof presignBody.message === "string"
        ? presignBody.message
        : `Presign failed (${presignResponse.status})`;
    throw new Error(message);
  }

  const presign = resolvePresignUrls(
    unwrapApiResponse<PresignPayload>(presignBody)
  );

  const uploadHeaders = buildS3UploadHeaders(presign.headers, contentType);

  const putResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: Buffer.from(await file.arrayBuffer()),
    headers: uploadHeaders,
  });

  if (!putResponse.ok) {
    const detail = (await putResponse.text()).trim().slice(0, 200);
    throw new Error(
      detail
        ? `Upload failed (${putResponse.status}): ${detail}`
        : `Upload failed (${putResponse.status})`
    );
  }

  return presign.publicUrl;
}
