import { getApiBaseUrl } from "@/lib/api/config";
import { unwrapApiResponse } from "@/lib/api/response";
import {
  validateEpisodeThumbnailFile,
} from "@/lib/api/episode-thumbnail-upload";
import type {
  QuizImageUploadOptions,
  QuizImageUploadUrlResponse,
} from "@/types/quiz";

type PresignPayload = QuizImageUploadUrlResponse & { url?: string };

/** Must match `getUploadSignedUrl` in ramayana-server `src/utils/s3.ts`. */
const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

function resolveContentType(file: File): string {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (file.type && allowed.has(file.type)) {
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
    "Cache-Control": pick("Cache-Control") ?? MEDIA_CACHE_CONTROL,
  };
}

function resolvePresignUrls(presign: PresignPayload): {
  uploadUrl: string;
  publicUrl: string;
  headers?: Record<string, string>;
  draftId?: string;
} {
  const uploadUrl = presign.uploadUrl?.trim();
  const publicUrl = (presign.publicUrl ?? presign.url)?.trim();

  if (!uploadUrl) {
    throw new Error("Presign response missing uploadUrl");
  }
  if (!publicUrl) {
    throw new Error("Presign response missing publicUrl");
  }

  return {
    uploadUrl,
    publicUrl,
    headers: presign.headers,
    draftId: presign.draftId?.trim() || undefined,
  };
}

export type QuizImageUploadResult = {
  publicUrl: string;
  draftId?: string;
};

/**
 * Presign on the backend, then PUT bytes to S3 from the server (avoids browser CORS).
 */
export async function uploadQuizImageViaPresign(
  file: File,
  authorization: string | null,
  options: QuizImageUploadOptions
): Promise<QuizImageUploadResult> {
  const validationError = validateEpisodeThumbnailFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const chapterId = options.chapterId?.trim();
  const episodeId = options.episodeId?.trim();
  if (!chapterId || !episodeId) {
    throw new Error("Chapter and episode are required to upload quiz images.");
  }

  const contentType = resolveContentType(file);
  const questionId = options.questionId?.trim() || undefined;
  const draftId = options.draftId?.trim() || undefined;

  const presignResponse = await fetch(
    `${getApiBaseUrl()}/quizzes/image/upload-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify({
        chapterId,
        episodeId,
        sequenceIndex: options.sequenceIndex,
        fileName: file.name,
        contentType,
        ...(questionId ? { questionId } : {}),
        ...(draftId ? { draftId } : {}),
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

  return { publicUrl: presign.publicUrl, draftId: presign.draftId };
}

// Re-export shared media validation for callers that need it.
export { validateEpisodeThumbnailFile as validateQuizImageFile };
