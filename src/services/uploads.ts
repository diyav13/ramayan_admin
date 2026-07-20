import { api } from "@/lib/api";
import { paths } from "@/lib/api/paths";
import { episodeService } from "@/services/episodes";

type UploadKind = "thumbnail" | "video"; // | "quizImage"

interface UploadResult {
  url: string;
}

const EPISODE_THUMBNAIL_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_EPISODE_THUMBNAIL_BYTES = 10 * 1024 * 1024;

async function uploadFile(kind: UploadKind, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const result = await api.upload<UploadResult>(
    paths.uploads[kind],
    formData
  );

  return result.url;
}

import type { EpisodeThumbnailUploadUrlResponse } from "@/types/episode";

type PresignPayload = EpisodeThumbnailUploadUrlResponse & { url?: string };

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

async function uploadEpisodeThumbnail(
  file: File,
  episodeId?: string
): Promise<string> {
  if (!EPISODE_THUMBNAIL_TYPES.has(file.type)) {
    throw new Error("Thumbnail must be JPEG, PNG, or WebP.");
  }

  if (file.size > MAX_EPISODE_THUMBNAIL_BYTES) {
    throw new Error("Thumbnail must be 10 MB or smaller.");
  }

  const presignRaw = await episodeService.getThumbnailUploadUrl({
    fileName: file.name,
    contentType: file.type,
    ...(episodeId ? { episodeId } : {}),
  });

  const presign = resolvePresignUrls(presignRaw);

  // #region agent log
  console.log("[thumb-debug] presign response", presign);
  fetch('http://127.0.0.1:7575/ingest/74428e7d-57d1-4707-9993-faa512483745',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'98511f'},body:JSON.stringify({sessionId:'98511f',runId:'post-fix',location:'uploads.ts:uploadEpisodeThumbnail',message:'presign response',data:{uploadUrl:presign.uploadUrl.slice(0,80),publicUrl:presign.publicUrl,headerKeys:presign.headers?Object.keys(presign.headers):[]},timestamp:Date.now(),hypothesisId:'A,C'})}).catch(()=>{});
  // #endregion

  const uploadHeaders: Record<string, string> = {
    ...presign.headers,
    "Content-Type": file.type,
  };

  const response = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: uploadHeaders,
  });

  // #region agent log
  console.log("[thumb-debug] S3 PUT result", { status: response.status, ok: response.ok });
  fetch('http://127.0.0.1:7575/ingest/74428e7d-57d1-4707-9993-faa512483745',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'98511f'},body:JSON.stringify({sessionId:'98511f',runId:'post-fix',location:'uploads.ts:uploadEpisodeThumbnail',message:'S3 PUT result',data:{status:response.status,ok:response.ok},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }

  return presign.publicUrl;
}

export const uploadService = {
  thumbnail: (file: File) => uploadFile("thumbnail", file),
  video: (file: File) => uploadFile("video", file),
  episodeThumbnail: (file: File, episodeId?: string) =>
    uploadEpisodeThumbnail(file, episodeId),
  // quizImage: (file: File) => uploadFile("quizImage", file), // temporarily disabled for image-sequence
};
