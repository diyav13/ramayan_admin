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

  const presign = await episodeService.getThumbnailUploadUrl({
    fileName: file.name,
    contentType: file.type,
    ...(episodeId ? { episodeId } : {}),
  });

  const uploadHeaders: Record<string, string> = {
    "Content-Type": file.type,
    ...presign.headers,
  };

  const response = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: uploadHeaders,
  });

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
