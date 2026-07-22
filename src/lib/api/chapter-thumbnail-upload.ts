import { getApiBaseUrl } from "@/lib/api/config";
import { unwrapApiResponse } from "@/lib/api/response";
import {
  buildS3UploadHeaders,
  resolveContentType,
  validateEpisodeThumbnailFile,
} from "@/lib/api/episode-thumbnail-upload";
import type { ChapterThumbnailUploadUrlResponse } from "@/types/chapter";

type PresignPayload = ChapterThumbnailUploadUrlResponse & { url?: string };

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

/**
 * Presign on the backend, then PUT bytes to S3 from the server (avoids browser CORS).
 */
export async function uploadChapterThumbnailViaPresign(
  file: File,
  authorization: string | null,
  chapterId?: string
): Promise<string> {
  const validationError = validateEpisodeThumbnailFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const contentType = resolveContentType(file);
  const entityId = chapterId?.trim() || undefined;

  const presignResponse = await fetch(
    `${getApiBaseUrl()}/chapters/thumbnail/upload-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType,
        ...(entityId ? { entityId } : {}),
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
